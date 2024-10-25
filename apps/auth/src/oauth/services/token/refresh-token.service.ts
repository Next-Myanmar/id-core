import { UserAgentDetails } from '@app/common';
import { UsersOauthService } from '@app/grpc/users-oauth';
import {
  AuthPrismaService,
  ClientOauth as ClientOauthPrisma,
} from '@app/prisma/auth';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { GrantHelper } from 'apps/auth/src/enums/grant.enum';
import { AuthOauthInfo } from 'apps/auth/src/types/auth-oauth-info.interface';
import { ClientOauth } from 'apps/auth/src/types/client-oauth.interface';
import { AuthType } from '../../../enums/auth-type.enum';
import { TokenGeneratorService } from '../../../services/token-generator.service';
import { TokenInfo } from '../../../types/token-info.interface';
import { TokenDto } from '../../dto/token.dto';
import { ScopeHelper } from '../../enums/scope.enum';
import { TokenPairResponse } from '../../types/token-pair-response.interface';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RefreshTokenService {
  private readonly logger = new Logger(RefreshTokenService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: AuthPrismaService,
    private readonly tokenService: TokenGeneratorService,
    private readonly usersOauthService: UsersOauthService,
  ) {}

  async handleRefreshToken(
    client: ClientOauthPrisma,
    generateTokenPairDto: TokenDto,
    userAgentDetails: UserAgentDetails,
  ): Promise<TokenPairResponse> {
    this.logger.log('Handle Refresh Token Start');

    const tokenInfo = await this.getRefreshTokenInfo(
      generateTokenPairDto.client_id,
      generateTokenPairDto.refresh_token,
    );

    const authInfo: AuthOauthInfo = tokenInfo.authInfo as AuthOauthInfo;

    const profile = await this.usersOauthService.getProfile({
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

        const newClientInfo: ClientOauth = {
          ...tokenInfo.client,
          grants: client.grants.map((grant) =>
            GrantHelper.convertToGrant(grant),
          ),
        };

        const newAuthInfo: AuthOauthInfo = {
          ...authInfo,
          profile,
          userAgentId: userAgentDetails.id,
        };

        const leeway = Number(this.config.getOrThrow('ACCESS_TOKEN_LEAKWAY'));

        const result = await this.tokenService.saveToken(
          AuthType.Oauth,
          newClientInfo,
          newAuthInfo,
          tokenInfo.accessTokenLifetime,
          tokenInfo.refreshTokenLifetime,
          leeway,
        );

        return {
          access_token: result.accessToken,
          expires_in: tokenInfo.accessTokenLifetime,
          refresh_token: result.refreshToken,
        };
      });
    });

    this.logger.log('Handle Refresh Token End');

    return result;
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
}
