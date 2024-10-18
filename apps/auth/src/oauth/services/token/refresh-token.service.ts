import { UserAgentDetails } from '@app/common';
import { UsersOauthService } from '@app/grpc/users-oauth';
import { AuthPrismaService } from '@app/prisma/auth';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { AuthType } from '../../../enums/auth-type.enum';
import { TokensService } from '../../../services/tokens.service';
import { TokenInfo } from '../../../types/token-info.interface';
import { getTokenFromAuthorization } from '../../../utils/utils';
import { TokenDto } from '../../dto/token.dto';
import { ScopeHelper } from '../../enums/scope.enum';
import { AuthOauthInfo } from '../../types/auth-oauth-info.interface';
import { TokenPairResponse } from '../../types/token-pair-response.interface';

@Injectable()
export class RefreshTokenService {
  private readonly logger = new Logger(RefreshTokenService.name);

  constructor(
    private readonly prisma: AuthPrismaService,
    private readonly tokenService: TokensService,
    private readonly usersOauthService: UsersOauthService,
  ) {}

  async handleRefreshToken(
    req: Request,
    generateTokenPairDto: TokenDto,
    userAgentDetails: UserAgentDetails,
  ): Promise<TokenPairResponse> {
    this.logger.log('Handle Refresh Token Start');

    const accessToken = await this.getAccessToken(req);

    const tokenInfo = await this.getRefreshTokenInfo(
      generateTokenPairDto.client_id,
      generateTokenPairDto.refresh_token,
    );

    const authInfo: AuthOauthInfo = tokenInfo.authInfo as AuthOauthInfo;

    await this.validateAccessToken(accessToken, tokenInfo);

    const profile = await this.usersOauthService.getData({
      userId: authInfo.userId,
      scopes: authInfo.scopes.map((scope) => ScopeHelper.convertToGrpc(scope)),
    });

    const result = await this.tokenService.transaction(async () => {
      return this.prisma.transaction(async (prisma) => {
        if (authInfo.userAgentId != userAgentDetails.id) {
          await prisma.device.update({
            where: {
              id: authInfo.deviceId,
            },
            data: { ua: userAgentDetails.ua },
          });
        }

        const newAuthInfo: AuthOauthInfo = {
          ...authInfo,
          profile,
          userAgentId: userAgentDetails.id,
        };

        const currentTime = new Date();
        const expiresAt = new Date(
          currentTime.getTime() + tokenInfo.accessTokenLifetime * 1000,
        );

        const result = await this.tokenService.saveToken(
          AuthType.Oauth,
          tokenInfo.client,
          newAuthInfo,
          tokenInfo.accessTokenLifetime,
          tokenInfo.refreshTokenLifetime,
        );

        return {
          access_token: result.accessToken,
          expires_at: expiresAt.getTime().toString(),
          refresh_token: result.refreshToken,
        };
      });
    });

    this.logger.log('Handle Refresh Token End');

    return result;
  }

  private async getAccessToken(req: Request): Promise<string> {
    const authorization = req.headers?.authorization;
    if (!authorization) {
      throw new UnauthorizedException();
    }
    const accessToken = getTokenFromAuthorization(authorization);
    this.logger.debug(`AccessToken: ${accessToken}`);

    return accessToken;
  }

  private async getRefreshTokenInfo(
    clientId: string,
    refreshToken: string,
  ): Promise<TokenInfo> {
    const tokenInfo = await this.tokenService.getRefreshToken(
      AuthType.Oauth,
      refreshToken,
    );

    if (!tokenInfo || tokenInfo.client.clientId !== clientId) {
      throw new UnauthorizedException();
    }

    return tokenInfo;
  }

  private async validateAccessToken(
    accessToken: string,
    tokenInfo: TokenInfo,
  ): Promise<void> {
    if (tokenInfo.accessToken !== accessToken) {
      this.logger.warn(
        `The access tokens are different. Stored Access Token: ${tokenInfo.accessToken}, Actual Access Token: ${accessToken}`,
      );

      await this.tokenService.transaction(async () => {
        await this.tokenService.revokeKeysInfo(
          AuthType.Oauth,
          tokenInfo.client,
          tokenInfo.authInfo,
        );

        await this.tokenService.revokeAccessToken(AuthType.Oauth, accessToken);
      });

      throw new UnauthorizedException();
    }
  }
}
