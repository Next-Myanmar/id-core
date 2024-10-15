import { OauthUser } from '@app/prisma/auth';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Scope } from 'apps/auth/src/oauth/enums/scope.enum';
import { AuthOauthInfo } from 'apps/auth/src/oauth/types/auth-oauth-info.interface';
import { TokensService } from 'apps/auth/src/services/tokens.service';
import { ClientOauth } from 'apps/auth/src/types/client-oauth.interface';
import { CodeChallengeMethod } from '../../enums/code-challenge-method.enum';
import { AuthorizeResponse } from '../../types/authorize.response.interface';

@Injectable()
export class CodeService {
  private readonly logger = new Logger(CodeService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly tokenService: TokensService,
  ) {}

  async handleCode(
    client: ClientOauth,
    userId: string,
    oauthUser: OauthUser,
    redirectUri: string,
    scopes: Scope[],
    codeChallenge: string,
    codeChallengeMethod: CodeChallengeMethod,
  ): Promise<AuthorizeResponse> {
    this.logger.log('Handle Code Start');

    const authorizationCodeInfo = await this.tokenService.transaction(
      async () => {
        const authorizationCodeLifetime = Number(
          this.config.getOrThrow('OAUTH_AUTHORIZATION_CODE_LIFETIME'),
        );

        const authInfo: AuthOauthInfo = {
          userId,
          oauthUserId: oauthUser.id,
          deviceId: await this.tokenService.generateRandomToken(),
          userAgentId: '',
          scopes,
          profile: null,
        };

        return await this.tokenService.saveAuthorizationCode(
          client,
          authInfo,
          redirectUri,
          authorizationCodeLifetime,
          codeChallenge,
          codeChallengeMethod,
        );
      },
    );

    this.logger.log('Handle Code End');

    return {
      code: authorizationCodeInfo.code,
    };
  }
}
