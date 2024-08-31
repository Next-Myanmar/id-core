import { RedisService, UserAgentDetails } from '@app/common';
import {
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { TOKEN_REDIS_PROVIDER } from '../../redis/token-redis.module';
import { TokenService } from '../../token/token.service';
import { getTokenFromAuthorization } from '../../utils/utils';

@Injectable()
export class LogoutService {
  private readonly logger = new Logger(LogoutService.name);

  constructor(
    @Inject(TOKEN_REDIS_PROVIDER)
    private readonly tokenRedis: RedisService,
    private readonly tokenService: TokenService,
  ) {}

  async logout(
    req: Request,
    userAgentDetails: UserAgentDetails,
  ): Promise<void> {
    const authorization = req.headers?.authorization;
    if (!authorization) {
      throw new UnauthorizedException();
    }
    const accessToken = getTokenFromAuthorization(authorization);
    this.logger.debug(`AccessToken: ${accessToken}`);

    const tokenInfo = await this.tokenService.authenticateUsers(
      accessToken,
      userAgentDetails.userAgentId,
    );

    await this.tokenRedis.transaction(async () => {
      await this.tokenService.revokeKeysInfo(
        tokenInfo.user.userId,
        tokenInfo.user.deviceId,
      );
    });
  }
}
