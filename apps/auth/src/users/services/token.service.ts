import { dateReviver, getUserAgentDetails, RedisService } from '@app/common';
import { TokenType } from '@app/common/grpc/auth-users';
import {
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { promisify } from 'util';
import { USERS_TOKEN_REDIS_PROVIDER } from '../../redis/users-token-redis.module';
import { KeysInfo } from '../types/keys-info';
import { TokenInfo } from '../types/token-info.interface';

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);

  constructor(
    @Inject(USERS_TOKEN_REDIS_PROVIDER)
    private readonly tokenRedis: RedisService,
  ) {}

  async generateRandomToken(): Promise<string> {
    const randomBytes = promisify(crypto.randomBytes);
    const buffer = await randomBytes(256);
    return crypto.createHash('sha1').update(buffer).digest('hex');
  }

  getKeysInfoKey(userId: string, deviceId: string): string {
    return `user-device-client-${userId}-${deviceId}`;
  }

  getAccessTokenKey(accessToken: string): string {
    return `access-token-${accessToken}`;
  }

  getRefreshTokenKey(refreshToken: string): string {
    return `refresh-token-${refreshToken}`;
  }

  async transaction<T>(callback: () => Promise<T>): Promise<T> {
    const result = await this.tokenRedis.transaction(async () => {
      return await callback();
    });

    return result;
  }

  async deleteKeysInfo(key: string, keysInfo: KeysInfo): Promise<void> {
    this.logger.debug('deleteKeysInfo Start');

    await this.tokenRedis.delete(keysInfo.accessTokenKey);
    this.logger.debug(`Deleted accessTokenKey: ${keysInfo.accessTokenKey}`);

    if (keysInfo.refreshTokenKey) {
      await this.tokenRedis.delete(keysInfo.refreshTokenKey);
      this.logger.debug(`Deleted refreshTokenKey: ${keysInfo.refreshTokenKey}`);
    }

    await this.tokenRedis.delete(key);

    this.logger.debug('deleteKeysInfo Start');
  }

  async revokeKeysInfo(userId: string, deviceId: string): Promise<void> {
    this.logger.debug('revokeKeysInfo Start');

    const key = this.getKeysInfoKey(userId, deviceId);

    this.logger.debug(`Keys Info Key: ${key}`);

    const value = await this.tokenRedis.get(key);

    this.logger.debug(`Keys Info: ${value}`);

    if (value) {
      const data: KeysInfo = JSON.parse(value);

      await this.deleteKeysInfo(key, data);
    }

    this.logger.debug('revokeKeysInfo End');
  }

  async saveKeysInfo(
    userId: string,
    deviceId: string,
    keysInfo: KeysInfo,
    lifetime: number,
  ): Promise<void> {
    this.logger.debug('saveKeysInfo Start');

    const key = this.getKeysInfoKey(userId, deviceId);

    this.logger.debug(`Keys Info Key: ${key}`);

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

  async saveTokens(
    userId: string,
    deviceId: string,
    userAgentSource: string,
    tokenType: TokenType,
    accessTokenLifetime: number,
    refreshTokenLifetime?: number,
  ): Promise<TokenInfo> {
    this.logger.debug('saveTokens Start');

    await this.revokeKeysInfo(userId, deviceId);

    const userAgentDetails = getUserAgentDetails(userAgentSource);
    const userAgentId = userAgentDetails.userAgentId;

    const accessToken = await this.generateRandomToken();
    const accessTokenExpiresAt = new Date(
      new Date().getTime() + accessTokenLifetime * 1000,
    );

    let tokenInfo: TokenInfo = {
      accessToken,
      accessTokenExpiresAt,
      accessTokenLifetime,
      user: {
        userId,
        deviceId,
        tokenType,
      },
      userAgentId,
    };
    this.logger.debug(`Access Token Info: ${JSON.stringify(tokenInfo)}`);

    const accessTokenKey = this.getAccessTokenKey(accessToken);

    this.logger.debug(`Access Token Key: ${accessTokenKey}`);

    await this.tokenRedis.setWithExpire(
      accessTokenKey,
      JSON.stringify(tokenInfo),
      accessTokenLifetime,
    );

    let keysInfo: KeysInfo = { accessTokenKey, tokenType };
    let lifetime = accessTokenLifetime;

    if (refreshTokenLifetime) {
      const refreshToken = await this.generateRandomToken();
      const refreshTokenExpiresAt = new Date(
        new Date().getTime() + refreshTokenLifetime * 1000,
      );

      tokenInfo = {
        ...tokenInfo,
        refreshToken,
        refreshTokenExpiresAt,
        refreshTokenLifetime,
      };
      this.logger.debug(`Refresh Token Info: ${JSON.stringify(tokenInfo)}`);

      const refreshTokenKey = this.getRefreshTokenKey(refreshToken);

      this.logger.debug(`Refresh Token Key: ${refreshTokenKey}`);

      await this.tokenRedis.setWithExpire(
        refreshTokenKey,
        JSON.stringify(tokenInfo),
        refreshTokenLifetime,
      );

      keysInfo = { ...keysInfo, refreshTokenKey };
      lifetime = refreshTokenLifetime;
    }

    await this.saveKeysInfo(userId, deviceId, keysInfo, lifetime);

    this.logger.debug('saveTokens End');

    return tokenInfo;
  }

  async authenticate(
    accessToken: string,
    userAgentId: string,
  ): Promise<TokenInfo> {
    this.logger.debug('authenticate Start');

    const accessTokenKey = this.getAccessTokenKey(accessToken);
    this.logger.debug(`Access Token Key: ${accessTokenKey}`);

    const value = await this.tokenRedis.get(accessTokenKey);
    this.logger.debug(`Access Token Info: ${value}`);

    if (!value) {
      throw new UnauthorizedException();
    }

    const tokenInfo: TokenInfo = JSON.parse(value);

    if (tokenInfo.userAgentId !== userAgentId) {
      this.logger.warn(
        `The useragents are different. Stored UserAgent: ${tokenInfo.userAgentId}, Actual UserAgent: ${userAgentId}`,
      );

      throw new UnauthorizedException();
    }

    this.logger.debug('authenticate End');

    return tokenInfo;
  }

  async checkRefreshToken(
    refreshToken: string,
    accessToken: string,
    userAgentId: string,
  ): Promise<TokenInfo> {
    this.logger.debug('checkRefreshToken Start');

    const refreshTokenKey = this.getRefreshTokenKey(refreshToken);
    this.logger.debug(`Refresh Token Key: ${refreshTokenKey}`);

    const value = await this.tokenRedis.get(refreshTokenKey);
    this.logger.debug(`Refresh Token Info: ${value}`);

    if (!value) {
      throw new UnauthorizedException();
    }

    const tokenInfo: TokenInfo = JSON.parse(value, dateReviver);

    if (tokenInfo.accessToken !== accessToken) {
      this.logger.warn(
        `The access tokens are different. Stored Access Token: ${tokenInfo.accessToken}, Actual Access Token: ${accessToken}`,
      );

      await this.revokeKeysInfo(tokenInfo.user.userId, tokenInfo.user.deviceId);

      const key = this.getAccessTokenKey(accessToken);
      await this.tokenRedis.delete(key);

      throw new UnauthorizedException();
    }

    if (tokenInfo.userAgentId !== userAgentId) {
      this.logger.warn(
        `The useragents are different. Stored UserAgent: ${tokenInfo.userAgentId}, Actual UserAgent: ${userAgentId}`,
      );

      await this.revokeKeysInfo(tokenInfo.user.userId, tokenInfo.user.deviceId);

      throw new UnauthorizedException();
    }

    this.logger.debug('checkRefreshToken End');

    return tokenInfo;
  }

  async getKeysInfo(
    userId: string,
    deviceId: string,
  ): Promise<{ key: string, keysInfo: KeysInfo } | null> {
    const key = this.getKeysInfoKey(userId, deviceId);

    this.logger.debug(`Keys Info Key: ${key}`);

    const value = await this.tokenRedis.get(key);

    if (value) {
      const keysInfo: KeysInfo = JSON.parse(value);

      return { key, keysInfo };
    }

    return null;
  }
}
