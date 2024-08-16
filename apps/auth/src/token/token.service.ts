import { getUserAgentDetails, RedisService } from '@app/common';
import { TokenType } from '@app/common/grpc/auth-users';
import {
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { promisify } from 'util';
import { TOKEN_REDIS_PROVIDER } from '../redis/token-redis.module';
import { AccessTokenInfo } from '../types/access-token-info.interface';
import { KeysInfo } from '../types/keys-info';
import { RefreshTokenInfo } from '../types/refresh-token-info.interface';
import { TokenInfo } from '../types/token-info.interface';

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);

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
    userId: string,
    deviceId: string,
    clientId: string = 'unknown',
  ): string {
    return `user-device-client-${userId}-${deviceId}-${clientId}`;
  }

  getAccessTokenKey(accessToken: string): string {
    return `access-token-${accessToken}`;
  }

  getRefreshTokenKey(refreshToken: string): string {
    return `refresh-token-${refreshToken}`;
  }

  async revokeKeysInfo(
    userId: string,
    deviceId: string,
    clientId: string = 'unknown',
  ): Promise<void> {
    this.logger.debug('revokeKeysInfo Start');

    const key = this.getKeysInfoKey(userId, deviceId, clientId);

    this.logger.debug(`Keys Info Key: ${key}`);

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

    this.logger.debug('revokeKeysInfo End');
  }

  async saveKeysInfo(
    userId: string,
    deviceId: string,
    keysInfo: KeysInfo,
    lifetime: number,
    clientId?: string,
  ): Promise<void> {
    this.logger.debug('saveKeysInfo Start');

    const key = this.getKeysInfoKey(userId, deviceId, clientId);

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

  async saveUsersToken(
    userId: string,
    deviceId: string,
    userAgentSource: string,
    tokenType: TokenType,
    accessTokenLifetime: number,
    refreshTokenLifetime?: number,
  ): Promise<TokenInfo> {
    this.logger.debug('saveUsersToken Start');

    await this.revokeKeysInfo(userId, deviceId);

    const userAgentDetails = getUserAgentDetails(userAgentSource);
    const userAgentId = userAgentDetails.userAgentId;

    const accessToken = await this.generateRandomToken();
    const accessTokenExpiresAt = new Date(
      new Date().getTime() + accessTokenLifetime * 1000,
    );

    const accessTokenInfo: AccessTokenInfo = {
      accessToken,
      accessTokenExpiresAt,
      user: {
        userId,
        deviceId,
        tokenType,
      },
      userAgentId,
    };
    this.logger.debug(`Access Token Info: ${JSON.stringify(accessTokenInfo)}`);

    const accessTokenKey = this.getAccessTokenKey(accessToken);

    this.logger.debug(`Access Token Key: ${accessTokenKey}`);

    await this.tokenRedis.setWithExpire(
      accessTokenKey,
      JSON.stringify(accessTokenInfo),
      accessTokenLifetime,
    );

    let keysInfo: KeysInfo = { accessTokenKey };
    let lifetime = accessTokenLifetime;
    let refreshTokenInfo: RefreshTokenInfo;

    if (refreshTokenLifetime) {
      const refreshToken = await this.generateRandomToken();
      const refreshTokenExpiresAt = new Date(
        new Date().getTime() + refreshTokenLifetime * 1000,
      );

      refreshTokenInfo = {
        refreshToken,
        refreshTokenExpiresAt,
        user: {
          userId,
          deviceId,
          tokenType,
        },
        userAgentId,
      };
      this.logger.debug(
        `Refresh Token Info: ${JSON.stringify(refreshTokenInfo)}`,
      );

      const refreshTokenKey = this.getRefreshTokenKey(refreshToken);

      this.logger.debug(`Refresh Token Key: ${refreshTokenKey}`);

      await this.tokenRedis.setWithExpire(
        refreshTokenKey,
        JSON.stringify(refreshTokenInfo),
        refreshTokenLifetime,
      );

      keysInfo = { ...keysInfo, refreshTokenKey };
      lifetime = refreshTokenLifetime;
    }

    await this.saveKeysInfo(userId, deviceId, keysInfo, lifetime);

    this.logger.debug('saveUsersToken End');

    return {
      ...accessTokenInfo,
      ...refreshTokenInfo,
    };
  }

  async authenticateUsers(
    accessToken: string,
    userAgentId: string,
  ): Promise<AccessTokenInfo> {
    this.logger.debug('authenticateUsers Start');

    const accessTokenKey = this.getAccessTokenKey(accessToken);
    this.logger.debug(`Access Token Key: ${accessTokenKey}`);

    const value = await this.tokenRedis.get(accessTokenKey);
    this.logger.debug(`Access Token Info: ${value}`);

    if (!value) {
      throw new UnauthorizedException();
    }

    const tokenInfo: AccessTokenInfo = JSON.parse(value);

    if (tokenInfo.userAgentId !== userAgentId) {
      this.logger.warn(
        `The useragents are different. Stored UserAgent: ${tokenInfo.userAgentId}, Actual UserAgent: ${userAgentId}`,
      );
      throw new UnauthorizedException();
    }

    this.logger.debug('authenticateUsers End');

    return tokenInfo;
  }
}
