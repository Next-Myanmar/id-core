import { RedisService } from '@app/common';
import { Inject, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { promisify } from 'util';
import { AuthType } from '../../enums/auth-type.enum';
import { AUTH_REDIS_PROVIDER } from '../../redis/auth-redis.module';
import { AuthOauthInfo } from '../../types/auth-oauth-info.interface';
import { ClientOauth } from '../../types/client-oauth.interface';
import { CodeChallengeMethod } from '../enums/code-challenge-method.enum';
import { AuthorizationCodeInfo } from '../types/authorization-code-info.interface';
import { AuthorizeKeysInfo } from '../types/authorize-keys-info.interface';

export class AuthorizeGeneratorService {
  private readonly logger = new Logger(AuthorizeGeneratorService.name);

  constructor(
    @Inject(AUTH_REDIS_PROVIDER)
    private readonly authRedis: RedisService,
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
    const key = `authorize-auth-type-client-user-device-${authType}-${clientId}-${userId}-${deviceId}`;
    this.logger.debug(`Keys Info Key: ${key}`);
    return key;
  }

  getAuthorizationCodeKey(authorizationCode: string): string {
    const key = `auth-type-authorization-code-${AuthType.Oauth}-${authorizationCode}`;
    this.logger.debug(`Authorization Code Key: ${key}`);
    return key;
  }

  async transaction<T>(callback: () => Promise<T>): Promise<T> {
    const result = await this.authRedis.transaction(async () => {
      return await callback();
    });

    return result;
  }

  async revokeKeysInfoByKey(key: string): Promise<void> {
    this.logger.debug('revokeKeysInfoByKey Start');

    const value = await this.authRedis.get(key);

    this.logger.debug(`Keys Info: ${value}`);

    if (value) {
      const data: AuthorizeKeysInfo = JSON.parse(value);

      if (data.authorizationCodeKey) {
        await this.authRedis.delete(data.authorizationCodeKey);
        this.logger.debug(
          `Deleted authorizationCodeKey: ${data.authorizationCodeKey}`,
        );
      }

      await this.authRedis.delete(key);
    }
    this.logger.debug('revokeKeysInfoByKey End');
  }

  async revokeKeysInfo(
    client: ClientOauth,
    authInfo: AuthOauthInfo,
  ): Promise<void> {
    this.logger.debug('revokeKeysInfo Start');

    const key = this.getKeysInfoKey(
      AuthType.Oauth,
      client.id,
      authInfo.userId,
      authInfo.deviceId,
    );

    await this.revokeKeysInfoByKey(key);

    this.logger.debug('revokeKeysInfo End');
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

    await this.revokeKeysInfo(client, authInfo);

    const authorizationCodeKey = this.getAuthorizationCodeKey(code);

    const data: AuthorizationCodeInfo = {
      code,
      redirectUri,
      client,
      authInfo,
      codeChallenge,
      codeChallengeMethod,
    };

    await this.authRedis.setWithExpire(
      authorizationCodeKey,
      JSON.stringify(data),
      authorizationCodeLifetime,
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

    const value = await this.authRedis.get(key);

    this.logger.debug(`Result: ${value}`);

    let data: AuthorizationCodeInfo;

    if (value) {
      data = JSON.parse(value);
    }

    this.logger.debug('getAuthorizationCode End');

    return data;
  }
}
