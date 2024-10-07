import { UserAgentDetails } from '@app/common';
import { TokenPairResponse, TokenType } from '@app/common/grpc/auth-users';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { TokenService } from '../../services/token.service';
import { AuthInfo } from '../../types/auth-info.interface';
import { getTokenFromAuthorization } from '../../utils/utils';
import { RefreshTokenDto } from '../dto/refresh-token.dto';

@Injectable()
export class RefreshTokenService {
  private readonly logger = new Logger(RefreshTokenService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
  ) {}

  async refreshToken(
    req: Request,
    refreshTokenDto: RefreshTokenDto,
    userAgentDetails: UserAgentDetails,
  ): Promise<TokenPairResponse> {
    const authorization = req.headers?.authorization;
    if (!authorization) {
      throw new UnauthorizedException();
    }
    const accessToken = getTokenFromAuthorization(authorization);
    this.logger.debug(`AccessToken: ${accessToken}`);

    const tokenInfo = await this.tokenService.getRefreshToken(
      refreshTokenDto.refreshToken,
    );

    if (!tokenInfo) {
      throw new UnauthorizedException();
    }

    if (tokenInfo.accessToken !== accessToken) {
      this.logger.warn(
        `The access tokens are different. Stored Access Token: ${tokenInfo.accessToken}, Actual Access Token: ${accessToken}`,
      );

      await this.tokenService.revokeKeysInfo(
        tokenInfo.client,
        tokenInfo.authInfo,
      );

      await this.tokenService.revokeAccessToken(accessToken);

      throw new UnauthorizedException();
    }

    let refreshTokenLifetime = tokenInfo.authInfo.refreshTokenLifetime;
    if (tokenInfo.authInfo.tokenType !== TokenType.Normal) {
      refreshTokenLifetime = Math.round(
        (tokenInfo.refreshTokenExpiresAt.getTime() - Date.now()) / 1000,
      );
    }

    this.logger.debug(`New Refresh Token Lifetime: ${refreshTokenLifetime}`);

    if (refreshTokenLifetime < tokenInfo.authInfo.accessTokenLifetime) {
      throw new UnauthorizedException();
    }

    const result = await this.tokenService.transaction(async () => {
      return this.prisma.transaction(async (prisma) => {
        if (tokenInfo.authInfo.userAgentId != userAgentDetails.id) {
          await prisma.device.update({
            where: {
              id: tokenInfo.authInfo.deviceId,
            },
            data: { ua: userAgentDetails.ua },
          });
        }

        const authInfo: AuthInfo = {
          ...tokenInfo.authInfo,
          userAgentId: userAgentDetails.id,
        };

        return await this.tokenService.saveUsersToken(
          tokenInfo.client,
          authInfo,
          tokenInfo.authInfo.accessTokenLifetime,
          refreshTokenLifetime,
        );
      });
    });

    const data: TokenPairResponse = {
      accessToken: result.accessToken,
      expiresAt: result.accessTokenExpiresAt.getTime().toString(),
      tokenType: result.authInfo.tokenType,
      refreshToken: result.refreshToken,
      deviceId: result.authInfo.deviceId,
    };

    return data;
  }
}
