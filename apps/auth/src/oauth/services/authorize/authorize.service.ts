import { I18nValidationException, i18nValidationMessage } from '@app/common';
import { TokenType } from '@app/grpc/auth-users';
import { ClientOauth as ClientOauthPrisma, OauthUser } from '@app/prisma/auth';
import { AuthPrismaService } from '@app/prisma/auth/auth-prisma.service';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { AuthType } from 'apps/auth/src/enums/auth-type.enum';
import { GrantHelper } from 'apps/auth/src/enums/grant.enum';
import { Scope, ScopeHelper } from 'apps/auth/src/oauth/enums/scope.enum';
import { TokenGeneratorService } from 'apps/auth/src/services/token-generator.service';
import { ClientOauth } from 'apps/auth/src/types/client-oauth.interface';
import { TokenInfo } from 'apps/auth/src/types/token-info.interface';
import { AuthUsersInfo } from 'apps/auth/src/types/users-auth-info.interface';
import { getTokenFromAuthorization } from 'apps/auth/src/utils/utils';
import { Request } from 'express';
import { I18nContext } from 'nestjs-i18n';
import { AuthorizeDto } from '../../dto/authorize.dto';
import { AuthorizeStatus } from '../../enums/authorize-status.enum';
import {
  ResponseType,
  ResponseTypeHelper,
} from '../../enums/response-type.enum';
import {
  AuthorizeResponse,
  ScopeDetailResponse,
} from '../../types/authorize.response.interface';
import { CodeService } from './code.service';

@Injectable()
export class AuthorizeService {
  private readonly logger = new Logger(AuthorizeService.name);

  constructor(
    private readonly prisma: AuthPrismaService,
    private readonly tokenService: TokenGeneratorService,
    private readonly codeService: CodeService,
  ) {}

  async authorize(
    req: Request,
    authorizeDto: AuthorizeDto,
    isConsent: boolean,
  ): Promise<AuthorizeResponse> {
    this.logger.log(`Response Type: ${authorizeDto.response_type}`);

    const { client, clientPrisma } = await this.getClient(
      authorizeDto.response_type,
      authorizeDto.client_id,
      authorizeDto.redirect_uri,
    );

    const usersTokenInfo = await this.getAccessTokenInfo(req);
    if (!usersTokenInfo) {
      throw new UnauthorizedException();
    }

    const usersAuthInfo: AuthUsersInfo =
      usersTokenInfo.authInfo as AuthUsersInfo;

    if (usersAuthInfo.tokenType !== TokenType.Normal) {
      throw new UnauthorizedException();
    }

    let oauthUser: OauthUser;

    if (isConsent) {
      oauthUser = await this.upsertOauthUser(
        client,
        usersTokenInfo,
        authorizeDto.scope,
      );
    } else {
      oauthUser = await this.getOauthUser(
        client,
        usersTokenInfo,
        authorizeDto.scope,
      );
      if (!oauthUser) {
        const i18nContext = I18nContext.current();

        const scopes = await Promise.all(
          authorizeDto.scope.map(async (scope) => {
            const data: ScopeDetailResponse = {
              scope,
              description: await i18nContext.t('oauth.scope.' + scope, {
                lang: i18nContext.lang,
              }),
            };

            return data;
          }),
        );

        return {
          status: AuthorizeStatus.Consent,
          data: {
            clientName: clientPrisma.clientName,
            scopes,
          },
        };
      }
    }

    if (authorizeDto.response_type === ResponseType.code) {
      return await this.codeService.handleCode(
        client,
        usersTokenInfo.authInfo.userId,
        oauthUser,
        authorizeDto.redirect_uri,
        authorizeDto.scope,
        authorizeDto.code_challenge,
        authorizeDto.code_challenge_method,
      );
    }

    return null;
  }

  private async getClient(
    responseType: ResponseType,
    clientId: string,
    redirectUri: string,
  ): Promise<{ client: ClientOauth; clientPrisma: ClientOauthPrisma }> {
    const client = await this.prisma.clientOauth.findUnique({
      where: {
        clientId,
        grants: {
          has: ResponseTypeHelper.convertToGrantPrisma(responseType),
        },
      },
      include: {
        clientSecrets: true,
      },
    });

    if (!client) {
      throw I18nValidationException.create({
        property: 'client_id',
        message: i18nValidationMessage({
          property: 'property.client_id',
          message: 'validation.INVALID',
        }),
      });
    }

    if (client.redirectUri !== redirectUri) {
      throw I18nValidationException.create({
        property: 'redirect_uri',
        message: i18nValidationMessage({
          property: 'property.redirect_uri',
          message: 'validation.INVALID',
        }),
      });
    }

    return {
      client: {
        id: client.id,
        clientId: client.clientId,
        homeUri: client.homeUri,
        grants: client.grants.map((grant) => GrantHelper.convertToGrant(grant)),
      },
      clientPrisma: client,
    };
  }

  private async getAccessTokenInfo(req: Request): Promise<TokenInfo> {
    const authorization = req.headers?.authorization;
    if (!authorization) {
      return null;
    }

    const accessToken = getTokenFromAuthorization(authorization);
    this.logger.debug(`AccessToken: ${accessToken}`);

    return await this.tokenService.getAccessToken(AuthType.Users, accessToken);
  }

  private async upsertOauthUser(
    client: ClientOauth,
    usersTokenInfo: TokenInfo,
    scopes: Scope[],
  ): Promise<OauthUser> {
    const oauthUser = await this.prisma.oauthUser.upsert({
      where: {
        clientOauthId_userId: {
          clientOauthId: client.id,
          userId: usersTokenInfo.authInfo.userId,
        },
      },
      create: {
        clientOauthId: client.id,
        userId: usersTokenInfo.authInfo.userId,
        scopes: scopes.map((scope) => ScopeHelper.convertToPrisma(scope)),
      },
      update: {
        scopes: scopes.map((scope) => ScopeHelper.convertToPrisma(scope)),
      },
    });

    return oauthUser;
  }

  private async getOauthUser(
    client: ClientOauth,
    usersTokenInfo: TokenInfo,
    scopes: Scope[],
  ): Promise<OauthUser> {
    const oauthUser = await this.prisma.oauthUser.findUnique({
      where: {
        clientOauthId_userId: {
          clientOauthId: client.id,
          userId: usersTokenInfo.authInfo.userId,
        },
        scopes: {
          hasEvery: scopes.map((scope) => ScopeHelper.convertToPrisma(scope)),
        },
      },
    });

    return oauthUser;
  }
}
