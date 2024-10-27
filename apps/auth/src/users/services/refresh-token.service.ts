import { UserAgentDetails } from '@app/common';
import { TokenType } from '@app/grpc/auth-users';
import { AuthPrismaService } from '@app/prisma/auth';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { AuthType } from '../../enums/auth-type.enum';
import { TokenGeneratorService } from '../../services/token-generator.service';
import { AuthUsersInfo } from '../../types/users-auth-info.interface';
import { getTokenFromAuthorization } from '../../utils/utils';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { TokenPairResponse } from '../types/token-pair.response';

@Injectable()
export class RefreshTokenService {
  private readonly logger = new Logger(RefreshTokenService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: AuthPrismaService,
    private readonly tokenService: TokenGeneratorService,
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
      AuthType.Users,
      refreshTokenDto.refreshToken,
    );

    if (!tokenInfo) {
      throw new UnauthorizedException();
    }

    if (tokenInfo.refreshTokenExpiresAt < Date.now()) {
      this.logger.debug('The refresh token has been expired.');
      throw new UnauthorizedException();
    }

    const leeway = Number(this.config.getOrThrow('TOKEN_LEAKWAY'));

    if (tokenInfo.accessToken !== accessToken) {
      this.logger.warn(
        `The access tokens are different. Stored Access Token: ${tokenInfo.accessToken}, Actual Access Token: ${accessToken}`,
      );

      await this.tokenService.transaction(async () => {
        await this.tokenService.revokeKeysInfo(
          AuthType.Users,
          tokenInfo.client,
          tokenInfo.authInfo,
        );

        await this.tokenService.revokeAccessToken(AuthType.Users, accessToken);
      });

      throw new UnauthorizedException();
    }

    const authInfo: AuthUsersInfo = tokenInfo.authInfo as AuthUsersInfo;

    let refreshTokenLifetime = tokenInfo.refreshTokenLifetime;
    if (authInfo.tokenType !== TokenType.Normal) {
      const refreshTokenKey = this.tokenService.getRefreshTokenKey(
        AuthType.Users,
        refreshTokenDto.refreshToken,
      );

      refreshTokenLifetime =
        (await this.tokenService.ttl(refreshTokenKey)) - leeway;
    }

    this.logger.debug(`New Refresh Token Lifetime: ${refreshTokenLifetime}`);

    if (refreshTokenLifetime < tokenInfo.accessTokenLifetime) {
      throw new UnauthorizedException();
    }

    return await this.tokenService.transaction(async () => {
      return this.prisma.transaction(async (prisma) => {
        if (authInfo.userAgentId != userAgentDetails.id) {
          await prisma.device.update({
            where: {
              id: authInfo.deviceId,
            },
            data: { ua: userAgentDetails.ua },
          });
        }

        const newAuthInfo: AuthUsersInfo = {
          ...authInfo,
          userAgentId: userAgentDetails.id,
        };

        const result = await this.tokenService.saveToken(
          AuthType.Users,
          tokenInfo.client,
          newAuthInfo,
          tokenInfo.accessTokenLifetime,
          refreshTokenLifetime,
          leeway,
        );

        return {
          accessToken: result.accessToken,
          expiresIn: tokenInfo.accessTokenLifetime,
          tokenType: authInfo.tokenType,
          refreshToken: result.refreshToken,
        };
      });
    });
  }
}
