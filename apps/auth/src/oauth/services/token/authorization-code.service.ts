import {
  I18nValidationException,
  i18nValidationMessage,
  UserAgentDetails,
} from '@app/common';
import { UsersOauthService } from '@app/grpc/users-oauth';
import { AuthPrismaService } from '@app/prisma/auth';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { AuthType } from '../../../enums/auth-type.enum';
import { TokensService } from '../../../services/tokens.service';
import { TokenDto } from '../../dto/token.dto';
import { CodeChallengeMethod } from '../../enums/code-challenge-method.enum';
import { ScopeHelper } from '../../enums/scope.enum';
import { AuthOauthInfo } from '../../types/auth-oauth-info.interface';
import { AuthorizationCodeInfo } from '../../types/authorization-code-info.interface';
import { TokenPairResponse } from '../../types/token-pair-response.interface';
import { base64urlencode } from '../../utils/base64';

@Injectable()
export class AuthorizationCodeService {
  private readonly logger = new Logger(AuthorizationCodeService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: AuthPrismaService,
    private readonly tokenService: TokensService,
    private readonly usersOauthService: UsersOauthService,
  ) {}

  async handleAuthorizationCode(
    generateTokenPairDto: TokenDto,
    userAgentDetails: UserAgentDetails,
  ): Promise<TokenPairResponse> {
    this.logger.log('Handle Authorization Code Start');

    const authorizationCodeInfo = await this.getAuthorizationCodeInfo(
      generateTokenPairDto.code,
      generateTokenPairDto.client_id,
      generateTokenPairDto.redirect_uri,
    );

    this.verifyCodeChallenge(
      authorizationCodeInfo,
      generateTokenPairDto.code_verifier,
    );

    const profile = await this.usersOauthService.getData({
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

        const accessTokenLifetime = Number(
          this.config.getOrThrow('OAUTH_ACCESS_TOKEN_LIFETIME'),
        );

        const refreshTokenLifetime = Number(
          this.config.getOrThrow('OAUTH_REFRESH_TOKEN_LIFETIME'),
        );

        const authInfo: AuthOauthInfo = {
          userId: authorizationCodeInfo.authInfo.userId,
          oauthUserId: device.userId,
          deviceId: device.id,
          userAgentId: userAgentDetails.id,
          scopes: authorizationCodeInfo.authInfo.scopes,
          profile,
        };

        const currentTime = new Date();
        const expiresAt = new Date(
          currentTime.getTime() + accessTokenLifetime * 1000,
        );

        const tokenInfo = await this.tokenService.saveToken(
          AuthType.Oauth,
          authorizationCodeInfo.client,
          authInfo,
          accessTokenLifetime,
          refreshTokenLifetime,
        );

        return {
          access_token: tokenInfo.accessToken,
          refresh_token: tokenInfo.refreshToken,
          expires_at: expiresAt.getTime().toString(),
        };
      });
    });

    this.logger.log('Handle Authorization Code End');

    return result;
  }

  private async getAuthorizationCodeInfo(
    code: string,
    clientId: string,
    redirectUri: string,
  ): Promise<AuthorizationCodeInfo> {
    const codeInfo = await this.tokenService.getAuthorizationCode(code);

    if (!codeInfo || codeInfo.client.clientId !== clientId) {
      throw I18nValidationException.create({
        property: 'code',
        message: i18nValidationMessage({
          property: 'property.code',
          message: 'validation.INVALID',
        }),
      });
    }

    if (codeInfo.redirectUri !== redirectUri) {
      throw I18nValidationException.create({
        property: 'redirect_uri',
        message: i18nValidationMessage({
          property: 'property.redirect_uri',
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
