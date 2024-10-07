import { dateReviver, RedisService } from '@app/common';
import { Inject, Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { AuthorizationCodeModel, ClientCredentialsModel } from 'oauth2-server';
import { promisify } from 'util';
import { Grant } from '../prisma/generated';
import { PrismaService } from '../prisma/prisma.service';
import { TOKEN_REDIS_PROVIDER } from '../redis/token-redis.module';
import { AuthInfo } from '../types/auth-info.interface';
import { AuthorizationCodeInfo } from '../types/authorization-code-info.interface';
import { ClientOauth } from '../types/client-oauth.interface';
import { Code } from '../types/code.interface';
import { KeysInfo } from '../types/keys-info';
import { TokenInfo } from '../types/token-info.interface';
import { Token } from '../types/token.interface';

@Injectable()
export class TokenService
  implements AuthorizationCodeModel, ClientCredentialsModel
{
  private readonly logger = new Logger(TokenService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(TOKEN_REDIS_PROVIDER)
    private readonly tokenRedis: RedisService,
  ) {}

  async generateRandomToken(): Promise<string> {
    const randomBytes = promisify(crypto.randomBytes);
    const buffer = await randomBytes(256);
    return crypto.createHash('sha1').update(buffer).digest('hex');
  }

  getKeysInfoKey(clientId: string, userId: string, deviceId: string): string {
    const key = `client-user-device-${clientId}-${userId}-${deviceId}`;
    this.logger.debug(`Keys Info Key: ${key}`);
    return key;
  }

  getAccessTokenKey(accessToken: string): string {
    const key = `access-token-${accessToken}`;
    this.logger.debug(`Access Token Key: ${key}`);
    return key;
  }

  getRefreshTokenKey(refreshToken: string): string {
    const key = `refresh-token-${refreshToken}`;
    this.logger.debug(`Refresh Token Key: ${key}`);
    return key;
  }

  getAuthorizationCodeKey(authorizationCode: string): string {
    const key = `authorization-code-${authorizationCode}`;
    this.logger.debug(`Authorization Code Key: ${key}`);
    return key;
  }

  private getExpiresAt(lifetimeInSeconds: number): Date {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + lifetimeInSeconds * 1000);
    return expiresAt;
  }

  private getLifetime(expiresAt: Date): number {
    return Math.floor((expiresAt.getTime() - new Date().getTime()) / 1000);
  }

  private async saveKeysInfo(
    client: ClientOauth,
    authInfo: AuthInfo,
    lifetime: number,
    keysInfo: KeysInfo,
  ): Promise<void> {
    this.logger.debug('saveKeysInfo Start');

    const key = this.getKeysInfoKey(
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

  async transaction<T>(callback: () => Promise<T>): Promise<T> {
    const result = await this.tokenRedis.transaction(async () => {
      return await callback();
    });

    return result;
  }

  async getClient(
    clientId: string,
    clientSecret?: string,
  ): Promise<ClientOauth> {
    this.logger.debug('getClient Start');
    this.logger.debug(`Client Id: ${clientId}, Client Secret: ${clientSecret}`);

    const clientSearchParams = { clientId };
    if (clientSecret) {
      clientSearchParams['clientSecret'] = clientSecret;
    }

    const client = await this.prisma.clientOauth.findUnique({
      where: clientSearchParams,
    });

    this.logger.debug(`Selected Client: ${JSON.stringify(client)}`);

    this.logger.debug('getClient End');

    return { ...client };
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

  async revokeKeysInfo(client: ClientOauth, authInfo: AuthInfo): Promise<void> {
    this.logger.debug('revokeKeysInfo Start');

    const key = this.getKeysInfoKey(
      client.id,
      authInfo.userId,
      authInfo.deviceId,
    );

    await this.revokeKeysInfoByKey(key);

    this.logger.debug('revokeKeysInfo End');
  }

  async saveToken(
    token: Token,
    client: ClientOauth,
    authInfo: AuthInfo,
  ): Promise<TokenInfo> {
    this.logger.debug('saveToken Start');

    this.logger.debug(`Token: ${JSON.stringify(token)}`);

    this.logger.debug('saveToken End');

    await this.revokeKeysInfo(client, authInfo);

    const tokenInfo: TokenInfo = {
      accessToken: token.accessToken,
      accessTokenExpiresAt: token.accessTokenExpiresAt,
      scope: token.scope,
      client,
      authInfo,
    };

    const accessTokenKey = this.getAccessTokenKey(token.accessToken);

    const accessTokenLifetime = this.getLifetime(token.accessTokenExpiresAt);

    this.logger.debug(`Access Token Lifetime: ${accessTokenLifetime}`);

    await this.tokenRedis.setWithExpire(
      accessTokenKey,
      JSON.stringify(tokenInfo),
      accessTokenLifetime,
    );

    let keysInfo: KeysInfo = { accessTokenKey };
    let lifetime = accessTokenLifetime;

    if (client.grants.includes(Grant.refresh_token)) {
      const refreshTokenKey = this.getRefreshTokenKey(token.refreshToken);

      const refreshTokenLifetime = this.getLifetime(
        token.refreshTokenExpiresAt,
      );

      this.logger.debug(`Refresh Token Lifetime: ${refreshTokenLifetime}`);

      tokenInfo.refreshToken = token.refreshToken;
      tokenInfo.refreshTokenExpiresAt = token.refreshTokenExpiresAt;

      await this.tokenRedis.setWithExpire(
        refreshTokenKey,
        JSON.stringify(tokenInfo),
        refreshTokenLifetime,
      );

      keysInfo = { ...keysInfo, refreshTokenKey };
      lifetime = refreshTokenLifetime;
    }

    await this.saveKeysInfo(client, authInfo, lifetime, keysInfo);

    this.logger.debug('saveToken End');

    return tokenInfo;
  }

  async getAccessToken(accessToken: string): Promise<TokenInfo> {
    this.logger.debug('getAccessToken Start');

    this.logger.debug(`Access Token: ${accessToken}`);

    const key = this.getAccessTokenKey(accessToken);

    const value = await this.tokenRedis.get(key);
    let data: TokenInfo;

    this.logger.debug(`Result: ${value}`);

    if (value) {
      data = JSON.parse(value, dateReviver);
    }

    this.logger.debug('getAccessToken End');

    return data;
  }

  async getRefreshToken(refreshToken: string): Promise<TokenInfo> {
    this.logger.debug('getRefreshToken Start');

    this.logger.debug(`Refresh Token: ${refreshToken}`);

    const key = this.getRefreshTokenKey(refreshToken);

    const value = await this.tokenRedis.get(key);

    this.logger.debug(`Result: ${value}`);

    let data: TokenInfo;

    if (value) {
      data = JSON.parse(value, dateReviver);
    }

    this.logger.debug('getRefreshToken End');

    return data;
  }

  async revokeAccessToken(accessToken: string): Promise<void> {
    this.logger.debug('revokeAccessToken Start');

    const accessTokenKey = this.getAccessTokenKey(accessToken);

    await this.tokenRedis.delete(accessTokenKey);
    this.logger.debug(`Deleted accessTokenKey: ${accessTokenKey}`);

    this.logger.debug('revokeAccessToken End');
  }

  async revokeToken(token: Token): Promise<boolean> {
    this.logger.debug('revokeToken Start');

    this.logger.debug(`Token: ${JSON.stringify(token)}`);

    const refreshTokenKey = this.getRefreshTokenKey(token.refreshToken);

    const value = await this.tokenRedis.get(refreshTokenKey);

    this.logger.debug(`Result: ${value}`);

    if (!value) {
      return false;
    }

    const refreshTokenInfo: TokenInfo = JSON.parse(value, dateReviver);

    await this.tokenRedis.delete(refreshTokenKey);
    this.logger.debug(`Deleted refreshTokenKey: ${refreshTokenKey}`);

    await this.revokeAccessToken(refreshTokenInfo.accessToken);

    this.logger.debug('revokeToken End');

    return true;
  }

  async saveAuthorizationCode(
    code: Code,
    client: ClientOauth,
    authInfo: AuthInfo,
  ): Promise<AuthorizationCodeInfo> {
    this.logger.debug('saveAuthorizationCode Start');

    this.logger.debug(`Authorization Code: ${JSON.stringify(code)}`);

    await this.revokeKeysInfo(client, authInfo);

    const authorizationCodeKey = this.getAuthorizationCodeKey(
      code.authorizationCode,
    );

    const codeLifetime = Math.floor(
      (code.expiresAt.getTime() - new Date().getTime()) / 1000,
    );

    this.logger.debug(`Authorization Code Lifetime: ${codeLifetime}`);

    const data: AuthorizationCodeInfo = {
      authorizationCode: code.authorizationCode,
      expiresAt: code.expiresAt,
      redirectUri: code.redirectUri,
      client,
      authInfo,
      scope: code.scope,
    };

    await this.tokenRedis.setWithExpire(
      authorizationCodeKey,
      JSON.stringify(data),
      codeLifetime,
    );

    await this.saveKeysInfo(client, authInfo, codeLifetime, {
      authorizationCodeKey,
    });

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

      delete data.redirectUri;
    }

    this.logger.debug('getAuthorizationCode End');

    return data;
  }

  async revokeAuthorizationCode(authorizationCode: Code): Promise<boolean> {
    this.logger.debug('revokeAuthorizationCode Start');

    this.logger.debug(
      `Authorization Code: ${JSON.stringify(authorizationCode)}`,
    );

    const authorizationCodeKey = this.getAuthorizationCodeKey(
      authorizationCode.authorizationCode,
    );

    const value = await this.tokenRedis.get(authorizationCodeKey);

    this.logger.debug(`Result: ${value}`);

    if (!value) {
      return false;
    }

    await this.tokenRedis.delete(authorizationCodeKey);
    this.logger.debug(`Deleted authorizationCodeKey: ${authorizationCodeKey}`);

    this.logger.debug('revokeAuthorizationCode End');

    return true;
  }

  verifyScope() {
    return Promise.resolve(true);
  }

  getUserFromClient() {
    return Promise.resolve({});
  }

  async saveUsersToken(
    client: ClientOauth,
    authInfo: AuthInfo,
    accessTokenLifetime: number,
    refreshTokenLifetime: number,
  ): Promise<TokenInfo> {
    this.logger.debug('saveUsersToken Start');

    const accessToken = await this.generateRandomToken();
    const accessTokenExpiresAt = this.getExpiresAt(accessTokenLifetime);

    const refreshToken = await this.generateRandomToken();
    const refreshTokenExpiresAt = this.getExpiresAt(refreshTokenLifetime);

    const token: Token = {
      accessToken,
      accessTokenExpiresAt,
      refreshToken,
      refreshTokenExpiresAt,
    };

    const tokenInfo = await this.saveToken(token, client, authInfo);

    this.logger.debug('saveUsersToken End');

    return tokenInfo;
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
}

interface CheckData {
  [key: string]: any;
}
