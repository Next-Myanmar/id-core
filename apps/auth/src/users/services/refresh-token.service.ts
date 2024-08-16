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
import { TokenInfo } from '../../types/token-info.interface';
import { getTokenFromAuthorization } from '../../utils/utils';
import { RefreshTokenDto } from '../dto/refresh-token.dto';

@Injectable()
export class RefreshTokenService {
  private readonly logger = new Logger(RefreshTokenService.name);

  constructor(
    @Inject(TOKEN_REDIS_PROVIDER)
    private readonly tokenRedis: RedisService,
    private readonly tokenService: TokenService,
  ) {}

  async refreshToken(
    req: Request,
    refreshTokenDto: RefreshTokenDto,
    userAgentDetails: UserAgentDetails,
  ): Promise<TokenInfo> {
    const authorization = req.headers?.authorization;
    if (!authorization) {
      throw new UnauthorizedException();
    }
    const accessToken = getTokenFromAuthorization(authorization);
    this.logger.debug(`AccessToken: ${accessToken}`);

    const tokenInfo = await this.tokenService.checkRefreshTokenUsers(
      refreshTokenDto.refreshToken,
      accessToken,
      userAgentDetails.userAgentId,
    );

    const result = this.tokenRedis.transaction(async () => {
      return await this.tokenService.saveUsersToken(
        tokenInfo.user.userId,
        tokenInfo.user.deviceId,
        userAgentDetails.userAgentSource,
        tokenInfo.user.tokenType,
        tokenInfo.accessTokenLifetime,
        tokenInfo.refreshTokenLifetime,
      );
    });

    return result;
  }
}
