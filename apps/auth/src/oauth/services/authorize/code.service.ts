import { OauthUser } from '@app/prisma/auth';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Scope } from 'apps/auth/src/oauth/enums/scope.enum';
import { AuthOauthInfo } from 'apps/auth/src/types/auth-oauth-info.interface';
import { ClientOauth } from 'apps/auth/src/types/client-oauth.interface';
import { AuthorizeStatus } from '../../enums/authorize-status.enum';
import { CodeChallengeMethod } from '../../enums/code-challenge-method.enum';
import { AuthorizeResponse } from '../../types/authorize.response.interface';
import { AuthorizeGeneratorService } from '../authorize-generator.service';

@Injectable()
export class CodeService {
  private readonly logger = new Logger(CodeService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly authorizeService: AuthorizeGeneratorService,
  ) {}

  async handleCode(
    client: ClientOauth,
    userId: string,
    deviceId: string,
    oauthUser: OauthUser,
    redirectUri: string,
    scopes: Scope[],
    codeChallenge: string,
    codeChallengeMethod: CodeChallengeMethod,
  ): Promise<AuthorizeResponse> {
    this.logger.log('Handle Code Start');

    const authorizationCodeInfo = await this.authorizeService.transaction(
      async () => {
        const authorizationCodeLifetime = Number(
          this.config.getOrThrow('OAUTH_AUTHORIZATION_CODE_LIFETIME'),
        );

        const authInfo: AuthOauthInfo = {
          userId,
          oauthUserId: oauthUser.id,
          deviceId,
          userAgentId: '',
          scopes,
          profile: null,
        };

        return await this.authorizeService.saveAuthorizationCode(
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
