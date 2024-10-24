import { OauthUser } from '@app/prisma/auth';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Scope } from 'apps/auth/src/oauth/enums/scope.enum';
import { TokenGeneratorService } from 'apps/auth/src/services/token-generator.service';
import { AuthOauthInfo } from 'apps/auth/src/types/auth-oauth-info.interface';
import { ClientOauth } from 'apps/auth/src/types/client-oauth.interface';
import { AuthorizeStatus } from '../../enums/authorize-status.enum';
import { CodeChallengeMethod } from '../../enums/code-challenge-method.enum';
import { AuthorizeResponse } from '../../types/authorize.response.interface';

@Injectable()
export class CodeService {
  private readonly logger = new Logger(CodeService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly tokenService: TokenGeneratorService,
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
      status: AuthorizeStatus.Success,
      data: {
        code: authorizationCodeInfo.code,
      },
    };
  }
}
