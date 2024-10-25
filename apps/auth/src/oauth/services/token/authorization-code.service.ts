import {
  I18nValidationException,
  i18nValidationMessage,
  UserAgentDetails,
} from '@app/common';
import { UsersOauthService } from '@app/grpc/users-oauth';
import {
  AuthPrismaService,
  ClientOauth as ClientOauthPrisma,
} from '@app/prisma/auth';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GrantHelper } from 'apps/auth/src/enums/grant.enum';
import { TokenGeneratorService } from 'apps/auth/src/services/token-generator.service';
import { AuthOauthInfo } from 'apps/auth/src/types/auth-oauth-info.interface';
import { ClientOauth } from 'apps/auth/src/types/client-oauth.interface';
import { createHash } from 'crypto';
import { AuthType } from '../../../enums/auth-type.enum';
import { TokenDto } from '../../dto/token.dto';
import { CodeChallengeMethod } from '../../enums/code-challenge-method.enum';
import { ScopeHelper } from '../../enums/scope.enum';
import { AuthorizationCodeInfo } from '../../types/authorization-code-info.interface';
import { TokenPairResponse } from '../../types/token-pair-response.interface';
import { base64urlencode } from '../../utils/base64';

@Injectable()
export class AuthorizationCodeService {
  private readonly logger = new Logger(AuthorizationCodeService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: AuthPrismaService,
    private readonly tokenService: TokenGeneratorService,
    private readonly usersOauthService: UsersOauthService,
  ) {}

  async handleAuthorizationCode(
    client: ClientOauthPrisma,
    generateTokenPairDto: TokenDto,
    userAgentDetails: UserAgentDetails,
  ): Promise<TokenPairResponse> {
    this.logger.log('Handle Authorization Code Start');

    if (client.redirectUri !== generateTokenPairDto.redirect_uri) {
      throw I18nValidationException.create({
        property: 'redirect_uri',
        message: i18nValidationMessage({
          property: 'property.redirect_uri',
          message: 'validation.INVALID',
        }),
      });
    }

    const authorizationCodeInfo =
      await this.getAuthorizationCodeInfo(generateTokenPairDto);

    this.verifyCodeChallenge(
      authorizationCodeInfo,
      generateTokenPairDto.code_verifier,
    );

    const profile = await this.usersOauthService.getProfile({
      userId: authorizationCodeInfo.authInfo.userId,
      scopes: authorizationCodeInfo.authInfo.scopes.map((scope) =>
        ScopeHelper.convertToGrpc(scope),
      ),
    });

    const result = await this.tokenService.transaction(async () => {
      return await this.prisma.transaction(async (prisma) => {
        await this.tokenService.revokeKeysInfo(
          AuthType.Oauth,
          authorizationCodeInfo.client,
          authorizationCodeInfo.authInfo,
        );

        const device = await prisma.device.create({
          data: {
            clientOauthId: authorizationCodeInfo.client.id,
            userId: authorizationCodeInfo.authInfo.oauthUserId,
            ua: userAgentDetails.ua,
          },
        });

        const leeway = Number(this.config.getOrThrow('ACCESS_TOKEN_LEAKWAY'));

        const accessTokenLifetime = Number(
          this.config.getOrThrow('OAUTH_ACCESS_TOKEN_LIFETIME'),
        );

        const refreshTokenLifetime = Number(
          this.config.getOrThrow('OAUTH_REFRESH_TOKEN_LIFETIME'),
        );

        const newClientInfo: ClientOauth = {
          id: client.id,
          clientId: client.clientId,
          grants: client.grants.map((grant) =>
            GrantHelper.convertToGrant(grant),
          ),
        };

        const newAuthInfo: AuthOauthInfo = {
          userId: authorizationCodeInfo.authInfo.userId,
          oauthUserId: authorizationCodeInfo.authInfo.oauthUserId,
          deviceId: device.id,
          userAgentId: userAgentDetails.id,
          scopes: authorizationCodeInfo.authInfo.scopes,
          profile,
        };

        const tokenInfo = await this.tokenService.saveToken(
          AuthType.Oauth,
          newClientInfo,
          newAuthInfo,
          accessTokenLifetime,
          refreshTokenLifetime,
          leeway,
        );

        return {
          access_token: tokenInfo.accessToken,
          refresh_token: tokenInfo.refreshToken,
          expires_in: accessTokenLifetime,
        };
      });
    });

    this.logger.log('Handle Authorization Code End');

    return result;
  }

  private async getAuthorizationCodeInfo(
    generateTokenPairDto: TokenDto,
  ): Promise<AuthorizationCodeInfo> {
    const codeInfo = await this.tokenService.getAuthorizationCode(
      generateTokenPairDto.code,
    );

    if (!codeInfo) {
      throw I18nValidationException.create({
        property: 'code',
        message: i18nValidationMessage({
          property: 'property.code',
          message: 'validation.INVALID',
        }),
      });
    }

    if (codeInfo.client.clientId !== generateTokenPairDto.client_id) {
      throw I18nValidationException.create({
        property: 'client_id',
        message: i18nValidationMessage({
          property: 'property.client_id',
          message: 'validation.INVALID',
        }),
      });
    }

    return codeInfo;
  }

  private verifyCodeChallenge(
    codeInfo: AuthorizationCodeInfo,
    codeVerifier: string,
  ): void {
    let isValid = false;
    if (codeInfo.codeChallengeMethod === CodeChallengeMethod.S256) {
      const codeHash = createHash('sha256').update(codeVerifier).digest();

      isValid = codeInfo.codeChallenge === base64urlencode(codeHash);
    }

    if (!isValid) {
      throw I18nValidationException.create({
        property: 'code_verifier',
        message: i18nValidationMessage({
          property: 'property.code_verifier',
          message: 'validation.INVALID',
        }),
      });
    }
  }
}
