import { dateReviver, RedisService } from '@app/common';
import { Inject, Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { promisify } from 'util';
import { AuthType } from '../enums/auth-type.enum';
import { Grant } from '../enums/grant.enum';
import { CodeChallengeMethod } from '../oauth/enums/code-challenge-method.enum';
import { AuthorizationCodeInfo } from '../oauth/types/authorization-code-info.interface';
import { TOKEN_REDIS_PROVIDER } from '../redis/token-redis.module';
import { AuthOauthInfo } from '../types/auth-oauth-info.interface';
import { ClientOauth } from '../types/client-oauth.interface';
import { KeysInfo } from '../types/keys-info';
import { TokenInfo } from '../types/token-info.interface';
import { AuthUsersInfo } from '../types/users-auth-info.interface';
import { getTimestamp } from '../utils/utils';

@Injectable()
export class TokenGeneratorService {
  private readonly logger = new Logger(TokenGeneratorService.name);

  constructor(
    @Inject(TOKEN_REDIS_PROVIDER)
    private readonly tokenRedis: RedisService,
  ) {}

  async generateRandomToken(): Promise<string> {
    const randomBytes = promisify(crypto.randomBytes);
    const buffer = await randomBytes(256);
    return crypto.createHash('sha1').update(buffer).digest('hex');
  }

  getKeysInfoKey(
    authType: AuthType,
    clientId: string,
    userId: string,
    deviceId: string,
  ): string {
    const key = `auth-type-client-user-device-${authType}-${clientId}-${userId}-${deviceId}`;
    this.logger.debug(`Keys Info Key: ${key}`);
    return key;
  }

  getAccessTokenKey(authType: AuthType, accessToken: string): string {
    const key = `auth-type-access-token-${authType}-${accessToken}`;
    this.logger.debug(`Access Token Key: ${key}`);
    return key;
  }

  getRefreshTokenKey(authType: AuthType, refreshToken: string): string {
    const key = `auth-type-refresh-token-${authType}-${refreshToken}`;
    this.logger.debug(`Refresh Token Key: ${key}`);
    return key;
  }

  getAuthorizationCodeKey(authorizationCode: string): string {
    const key = `auth-type-authorization-code-${AuthType.Oauth}-${authorizationCode}`;
    this.logger.debug(`Authorization Code Key: ${key}`);
    return key;
  }

  async transaction<T>(callback: () => Promise<T>): Promise<T> {
    const result = await this.tokenRedis.transaction(async () => {
      return await callback();
    });

    return result;
  }

  async saveKeysInfo(
    authType: AuthType,
    client: ClientOauth,
    authInfo: AuthUsersInfo | AuthOauthInfo,
    lifetime: number,
    keysInfo: KeysInfo,
  ): Promise<void> {
    this.logger.debug('saveKeysInfo Start');

    const key = this.getKeysInfoKey(
      authType,
      client.id,
      authInfo.userId,
      authInfo.deviceId,
    );

    await this.tokenRedis.setWithExpire(
      key,
      JSON.stringify(keysInfo),
      lifetime,
    );

    this.logger.debug(
      `Keys Info: ${JSON.stringify(keysInfo)}, lifetime: ${lifetime}`,
    );

    this.logger.debug('saveKeysInfo End');
  }

  async updateKeysInfo(
    authType: AuthType,
    client: ClientOauth,
    authInfo: AuthUsersInfo | AuthOauthInfo,
    updateKeysInfo: KeysInfo,
  ): Promise<void> {
    this.logger.debug('updateKeysInfo Start');

    const key = this.getKeysInfoKey(
      authType,
      client.id,
      authInfo.userId,
      authInfo.deviceId,
    );

    await this.tokenRedis.update(key, JSON.stringify(updateKeysInfo));

    this.logger.debug(`Updated Keys Info: ${JSON.stringify(updateKeysInfo)}`);

    this.logger.debug('updateKeysInfo End');
  }

  async getKeysInfo(
    authType: AuthType,
    client: ClientOauth,
    authInfo: AuthUsersInfo | AuthOauthInfo,
  ): Promise<KeysInfo | undefined> {
    this.logger.debug('getKeysInfo Start');

    const key = this.getKeysInfoKey(
      authType,
      client.id,
      authInfo.userId,
      authInfo.deviceId,
    );

    const value = await this.tokenRedis.get(key);
    let data: KeysInfo;

    this.logger.debug(`Result: ${value}`);

    if (value) {
      data = JSON.parse(value);
    }

    this.logger.debug('getKeysInfo End');

    return data;
  }

  async revokeKeysInfoByKey(key: string): Promise<void> {
    this.logger.debug('revokeKeysInfoByKey Start');

    const value = await this.tokenRedis.get(key);

    this.logger.debug(`Keys Info: ${value}`);

    if (value) {
      const data: KeysInfo = JSON.parse(value);

      if (data.authorizationCodeKey) {
        await this.tokenRedis.delete(data.authorizationCodeKey);
        this.logger.debug(
          `Deleted authorizationCodeKey: ${data.authorizationCodeKey}`,
        );
      }

      if (data.accessTokenKey) {
        await this.tokenRedis.delete(data.accessTokenKey);
        this.logger.debug(`Deleted accessTokenKey: ${data.accessTokenKey}`);
      }

      if (data.refreshTokenKey) {
        await this.tokenRedis.delete(data.refreshTokenKey);
        this.logger.debug(`Deleted refreshTokenKey: ${data.refreshTokenKey}`);
      }

      await this.tokenRedis.delete(key);
    }
    this.logger.debug('revokeKeysInfoByKey End');
  }

  async revokeKeysInfo(
    authType: AuthType,
    client: ClientOauth,
    authInfo: AuthUsersInfo | AuthOauthInfo,
  ): Promise<void> {
    this.logger.debug('revokeKeysInfo Start');

    const key = this.getKeysInfoKey(
      authType,
      client.id,
      authInfo.userId,
      authInfo.deviceId,
    );

    await this.revokeKeysInfoByKey(key);

    this.logger.debug('revokeKeysInfo End');
  }

  async saveToken(
    authType: AuthType,
    client: ClientOauth,
    authInfo: AuthUsersInfo | AuthOauthInfo,
    accessTokenLifetime: number,
    refreshTokenLifetime: number,
    leeway: number,
  ): Promise<TokenInfo> {
    this.logger.debug('saveToken Start');

    await this.revokeKeysInfo(authType, client, authInfo);

    const accessToken = await this.generateRandomToken();

    const accessTokenExpiresAt = getTimestamp(accessTokenLifetime);

    const tokenInfo: TokenInfo = {
      accessToken,
      accessTokenLifetime,
      accessTokenExpiresAt,
      client,
      authInfo,
      authType,
    };

    const accessTokenKey = this.getAccessTokenKey(authType, accessToken);

    await this.tokenRedis.setWithExpire(
      accessTokenKey,
      JSON.stringify(tokenInfo),
      accessTokenLifetime + leeway,
    );

    let keysInfo: KeysInfo = { accessTokenKey };
    let lifetime = accessTokenLifetime + leeway;

    if (client.grants.includes(Grant.RefreshToken)) {
      const refreshToken = await this.generateRandomToken();

      const refreshTokenKey = this.getRefreshTokenKey(authType, refreshToken);

      const refreshTokenExpiresAt = getTimestamp(refreshTokenLifetime);

      tokenInfo.refreshToken = refreshToken;
      tokenInfo.refreshTokenLifetime = refreshTokenLifetime;
      tokenInfo.refreshTokenExpiresAt = refreshTokenExpiresAt;

      await this.tokenRedis.setWithExpire(
        refreshTokenKey,
        JSON.stringify(tokenInfo),
        refreshTokenLifetime + leeway,
      );

      keysInfo = { ...keysInfo, refreshTokenKey };
      lifetime = refreshTokenLifetime + leeway;
    }

    await this.saveKeysInfo(authType, client, authInfo, lifetime, keysInfo);

    this.logger.debug('saveToken End');

    return tokenInfo;
  }

  async getAccessToken(
    authType: AuthType,
    accessToken: string,
  ): Promise<TokenInfo | undefined> {
    this.logger.debug('getAccessToken Start');

    this.logger.debug(`Access Token: ${accessToken}`);

    const key = this.getAccessTokenKey(authType, accessToken);

    const value = await this.tokenRedis.get(key);
    let data: TokenInfo;

    this.logger.debug(`Result: ${value}`);

    if (value) {
      data = JSON.parse(value, dateReviver);
    }

    this.logger.debug('getAccessToken End');

    return data;
  }

  async getRefreshToken(
    authType: AuthType,
    refreshToken: string,
  ): Promise<TokenInfo | undefined> {
    this.logger.debug('getRefreshToken Start');

    this.logger.debug(`Refresh Token: ${refreshToken}`);

    const key = this.getRefreshTokenKey(authType, refreshToken);

    const value = await this.tokenRedis.get(key);

    this.logger.debug(`Result: ${value}`);

    let data: TokenInfo;

    if (value) {
      data = JSON.parse(value, dateReviver);
    }

    this.logger.debug('getRefreshToken End');

    return data;
  }

  async revokeAccessToken(
    authType: AuthType,
    accessToken: string,
  ): Promise<void> {
    this.logger.debug('revokeAccessToken Start');

    const accessTokenKey = this.getAccessTokenKey(authType, accessToken);

    await this.tokenRedis.delete(accessTokenKey);
    this.logger.debug(`Deleted accessTokenKey: ${accessTokenKey}`);

    this.logger.debug('revokeAccessToken End');
  }

  async revokeRefreshToken(
    authType: AuthType,
    refrshToken: string,
  ): Promise<void> {
    this.logger.debug('revokeRefreshToken Start');

    const refreshTokenKey = this.getRefreshTokenKey(authType, refrshToken);

    await this.tokenRedis.delete(refreshTokenKey);
    this.logger.debug(`Deleted refreshToken: ${refreshTokenKey}`);

    this.logger.debug('revokeRefreshToken End');
  }

  async saveAuthorizationCode(
    client: ClientOauth,
    authInfo: AuthOauthInfo,
    redirectUri: string,
    authorizationCodeLifetime: number,
    codeChallenge: string,
    codeChallengeMethod: CodeChallengeMethod,
  ): Promise<AuthorizationCodeInfo> {
    this.logger.debug('saveAuthorizationCode Start');

    const code = await this.generateRandomToken();

    this.logger.debug(`Authorization Code: ${JSON.stringify(code)}`);

    await this.revokeKeysInfo(AuthType.Oauth, client, authInfo);

    const authorizationCodeKey = this.getAuthorizationCodeKey(code);

    const data: AuthorizationCodeInfo = {
      code,
      redirectUri,
      client,
      authInfo,
      codeChallenge,
      codeChallengeMethod,
    };

    await this.tokenRedis.setWithExpire(
      authorizationCodeKey,
      JSON.stringify(data),
      authorizationCodeLifetime,
    );

    await this.saveKeysInfo(
      AuthType.Oauth,
      client,
      authInfo,
      authorizationCodeLifetime,
      {
        authorizationCodeKey,
      },
    );

    this.logger.debug('saveAuthorizationCode End');

    return data;
  }

  async getAuthorizationCode(
    authorizationCode: string,
  ): Promise<AuthorizationCodeInfo> {
    this.logger.debug('getAuthorizationCode Start');

    this.logger.debug(`Authorization Code: ${authorizationCode}`);

    const key = this.getAuthorizationCodeKey(authorizationCode);

    const value = await this.tokenRedis.get(key);

    this.logger.debug(`Result: ${value}`);

    let data: AuthorizationCodeInfo;

    if (value) {
      data = JSON.parse(value, dateReviver);
    }

    this.logger.debug('getAuthorizationCode End');

    return data;
  }

  async checkAvailableKeysInfos(checkData: CheckData): Promise<CheckData> {
    const keys = Object.keys(checkData);

    const data = await this.tokenRedis.mget(...keys);
    const availableData = data.reduce((acc, value, index) => {
      if (value !== null) {
        const key = keys[index];
        acc[key] = checkData[key];
      }
      return acc;
    }, {} as CheckData);

    return availableData;
  }

  async ttl(key: string): Promise<number> {
    return await this.tokenRedis.ttl(key);
  }
}

interface CheckData {
  [key: string]: any;
}
