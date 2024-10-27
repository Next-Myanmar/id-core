import {
  compareHash,
  I18nValidationException,
  i18nValidationMessage,
} from '@app/common';
import { AuthPrismaService } from '@app/prisma/auth';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { AuthType } from '../../enums/auth-type.enum';
import { TokenGeneratorService } from '../../services/token-generator.service';
import { AuthOauthInfo } from '../../types/auth-oauth-info.interface';
import { TokenInfo } from '../../types/token-info.interface';
import { IntrospectTokenDto } from '../dto/introspect-token.dto';
import { TokenTypeHint } from '../enums/token-type-hint.enum';
import { IntrospectResponse } from '../types/introspect.response';

@Injectable()
export class IntrospectTokenService {
  private readonly logger = new Logger(IntrospectTokenService.name);

  constructor(
    private readonly prisma: AuthPrismaService,
    private readonly tokenService: TokenGeneratorService,
  ) {}

  async introspect(
    introspectDto: IntrospectTokenDto,
  ): Promise<IntrospectResponse> {
    await this.checkClient(
      introspectDto.client_id,
      introspectDto.client_secret,
    );

    let tokenInfo: TokenInfo;
    let tokenExpiresAt: number;

    if (introspectDto.token_type_hint === TokenTypeHint.AccessToken) {
      tokenInfo = await this.getAccessToken(
        introspectDto.client_id,
        introspectDto.token,
      );
      tokenExpiresAt = tokenInfo?.accessTokenExpiresAt;
    } else if (introspectDto.token_type_hint === TokenTypeHint.RefreshToken) {
      tokenInfo = await this.getRefreshToken(
        introspectDto.client_id,
        introspectDto.token,
      );
      tokenExpiresAt = tokenInfo?.refreshTokenExpiresAt;
    } else {
      tokenInfo = await this.getAccessToken(
        introspectDto.client_id,
        introspectDto.token,
      );
      tokenExpiresAt = tokenInfo?.accessTokenExpiresAt;

      if (!tokenInfo) {
        tokenInfo = await this.getRefreshToken(
          introspectDto.client_id,
          introspectDto.token,
        );
        tokenExpiresAt = tokenInfo?.refreshTokenExpiresAt;
      }
    }

    if (!tokenInfo) {
      return {
        active: false,
      };
    }

    const authOauthInfo: AuthOauthInfo = tokenInfo.authInfo as AuthOauthInfo;

    return {
      active: true,
      client_id: introspectDto.client_id,
      scope: authOauthInfo.scopes.join(' '),
      user_id: authOauthInfo.oauthUserId,
      exp: tokenExpiresAt,
    };
  }

  private async checkClient(
    clientId: string,
    clientSecret: string,
  ): Promise<void> {
    const client = await this.prisma.clientOauth.findUnique({
      where: {
        clientId,
        clientSecrets: {
          some: {
            isDeleted: false,
          },
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

    const validSecrets = await Promise.all(
      client.clientSecrets.map(
        async (data) => await compareHash(clientSecret, data.secret),
      ),
    );
    const isValidSecret = validSecrets.some(
      (validSecret) => validSecret === true,
    );

    if (!isValidSecret) {
      throw I18nValidationException.create({
        property: 'client_secret',
        message: i18nValidationMessage({
          property: 'property.client_secret',
          message: 'validation.INVALID',
        }),
      });
    }
  }

  private async getAccessToken(
    clientId: string,
    accessToken: string,
  ): Promise<TokenInfo | undefined> {
    const tokenInfo = await this.tokenService.getAccessToken(
      AuthType.Oauth,
      accessToken,
    );

    if (tokenInfo?.client.clientId != clientId) {
      throw new UnauthorizedException();
    }

    return tokenInfo;
  }

  private async getRefreshToken(
    clientId: string,
    refreshToken: string,
  ): Promise<TokenInfo | undefined> {
    const tokenInfo = await this.tokenService.getRefreshToken(
      AuthType.Oauth,
      refreshToken,
    );

    if (tokenInfo?.client.clientId != clientId) {
      throw new UnauthorizedException();
    }

    return tokenInfo;
  }
}
