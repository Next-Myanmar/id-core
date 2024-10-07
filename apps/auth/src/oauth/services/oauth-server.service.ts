import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import * as OAuth2Server from 'oauth2-server';
import { Grant } from '../../prisma/generated';
import { TokenService } from '../../services/token.service';
import { TokenInfo } from '../../types/token-info.interface';

@Injectable()
export class OauthServerService {
  private readonly server: OAuth2Server;

  constructor(
    private readonly config: ConfigService,
    private readonly model: TokenService,
  ) {
    const accessTokenLifetime = Number(
      this.config.getOrThrow('OAUTH_ACCESS_TOKEN_LIFETIME'),
    );
    const refreshTokenLifetime = Number(
      this.config.getOrThrow('OAUTH_REFRESH_TOKEN_LIFETIME'),
    );

    this.server = new OAuth2Server({
      model,
      allowEmptyState: true,
      accessTokenLifetime: accessTokenLifetime,
      refreshTokenLifetime: refreshTokenLifetime,
    });
  }

  async authorize(
    req: Request,
    res: Response,
    user: any,
  ): Promise<{ code: string; redirectUri: string }> {
    req.body.response_type = 'code';

    return this.server
      .authorize(
        new OAuth2Server.Request(req),
        new OAuth2Server.Response(res),
        {
          authenticateHandler: {
            handle: () => user,
          },
        },
      )
      .then((code: any) => {
        return {
          code: code.authorizationCode,
          redirectUri: code.redirectUri,
        };
      });
  }

  async token(req: Request, res: Response, grant: Grant): Promise<TokenInfo> {
    req.body.grant_type = grant;

    return this.server
      .token(new OAuth2Server.Request(req), new OAuth2Server.Response(res))
      .then((token: TokenInfo) => {
        return token;
      });
  }

  async authenticate(req: Request, res: Response): Promise<TokenInfo> {
    return this.server
      .authenticate(
        new OAuth2Server.Request(req),
        new OAuth2Server.Response(res),
      )
      .then((token: TokenInfo) => {
        return token;
      });
  }
}
