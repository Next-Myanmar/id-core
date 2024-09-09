import { UserAgentDetails } from '@app/common';
import { TokenType } from '@app/common/grpc/auth-users';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { getTokenFromAuthorization } from '../../utils/utils';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { TokenInfo } from '../types/token-info.interface';
import { TokenService } from './token.service';

@Injectable()
export class RefreshTokenService {
  private readonly logger = new Logger(RefreshTokenService.name);

  constructor(private readonly tokenService: TokenService) {}

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

    const tokenInfo = await this.tokenService.checkRefreshToken(
      refreshTokenDto.refreshToken,
      accessToken,
      userAgentDetails.userAgentId,
    );

    let refreshTokenLifetime = tokenInfo.refreshTokenLifetime;
    if (tokenInfo.user.tokenType !== TokenType.Normal) {
      refreshTokenLifetime = Math.round(
        (tokenInfo.refreshTokenExpiresAt.getTime() - Date.now()) / 1000,
      );
    }

    this.logger.debug(`New Refresh Token Lifetime: ${refreshTokenLifetime}`);

    if (refreshTokenLifetime < tokenInfo.accessTokenLifetime) {
      throw new UnauthorizedException();
    }

    const result = await this.tokenService.transaction(async () => {
      return await this.tokenService.saveTokens(
        tokenInfo.user.userId,
        tokenInfo.user.deviceId,
        userAgentDetails.userAgentSource,
        tokenInfo.user.tokenType,
        tokenInfo.accessTokenLifetime,
        refreshTokenLifetime,
      );
    });

    return result;
  }
}
