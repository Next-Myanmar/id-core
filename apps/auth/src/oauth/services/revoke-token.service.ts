import {
  compareHash,
  I18nValidationException,
  i18nValidationMessage,
} from '@app/common';
import { AuthPrismaService } from '@app/prisma/auth';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { AuthType } from '../../enums/auth-type.enum';
import { TokenGeneratorService } from '../../services/token-generator.service';
import { RevokeTokenDto } from '../dto/revoke-token.dto';
import { TokenTypeHint } from '../enums/token-type-hint.enum';

@Injectable()
export class RevokeTokenService {
  private readonly logger = new Logger(RevokeTokenService.name);

  constructor(
    private readonly prisma: AuthPrismaService,
    private readonly tokenService: TokenGeneratorService,
  ) {}

  async revoke(revokeDto: RevokeTokenDto): Promise<void> {
    await this.checkClient(revokeDto.client_id, revokeDto.client_secret);

    if (revokeDto.token_type_hint === TokenTypeHint.AccessToken) {
      await this.revokeAccessToken(revokeDto.client_id, revokeDto.token, true);
    } else if (revokeDto.token_type_hint === TokenTypeHint.RefreshToken) {
      await this.revokeRefreshToken(revokeDto.client_id, revokeDto.token);
    } else {
      const isAccessTokenRevoked = await this.revokeAccessToken(
        revokeDto.client_id,
        revokeDto.token,
        false,
      );

      if (!isAccessTokenRevoked) {
        await this.revokeRefreshToken(revokeDto.client_id, revokeDto.token);
      }
    }
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

  private async revokeAccessToken(
    clientId: string,
    accessToken: string,
    throwError: boolean,
  ): Promise<boolean> {
    const tokenInfo = await this.tokenService.getAccessToken(
      AuthType.Oauth,
      accessToken,
    );

    if (!tokenInfo) {
      if (throwError) {
        throw I18nValidationException.create({
          property: 'token',
          message: i18nValidationMessage({
            property: 'property.token',
            message: 'validation.INVALID',
          }),
        });
      }

      return false;
    }

    if (tokenInfo.client.clientId != clientId) {
      throw new UnauthorizedException();
    }

    const keysInfo = await this.tokenService.getKeysInfo(
      AuthType.Oauth,
      tokenInfo.client,
      tokenInfo.authInfo,
    );

    await this.tokenService.transaction(async () => {
      await this.tokenService.revokeAccessToken(AuthType.Oauth, accessToken);

      if (keysInfo) {
        if (keysInfo.refreshTokenKey) {
          keysInfo.accessTokenKey = undefined;

          await this.tokenService.updateKeysInfo(
            AuthType.Oauth,
            tokenInfo.client,
            tokenInfo.authInfo,
            keysInfo,
          );
        } else {
          await this.tokenService.revokeKeysInfo(
            AuthType.Oauth,
            tokenInfo.client,
            tokenInfo.authInfo,
          );
        }
      }
    });

    return true;
  }

  private async revokeRefreshToken(
    clientId: string,
    refreshToken: string,
  ): Promise<void> {
    const tokenInfo = await this.tokenService.getRefreshToken(
      AuthType.Oauth,
      refreshToken,
    );

    if (!tokenInfo) {
      throw I18nValidationException.create({
        property: 'token',
        message: i18nValidationMessage({
          property: 'property.token',
          message: 'validation.INVALID',
        }),
      });
    }

    if (tokenInfo.client.clientId != clientId) {
      throw new UnauthorizedException();
    }

    const keysInfo = await this.tokenService.getKeysInfo(
      AuthType.Oauth,
      tokenInfo.client,
      tokenInfo.authInfo,
    );

    await this.tokenService.transaction(async () => {
      await this.tokenService.revokeRefreshToken(AuthType.Oauth, refreshToken);

      if (keysInfo) {
        if (keysInfo.accessTokenKey) {
          const ttl = await this.tokenService.ttl(keysInfo.accessTokenKey);

          keysInfo.refreshTokenKey = undefined;

          await this.tokenService.revokeKeysInfo(
            AuthType.Oauth,
            tokenInfo.client,
            tokenInfo.authInfo,
          );

          await this.tokenService.saveKeysInfo(
            AuthType.Oauth,
            tokenInfo.client,
            tokenInfo.authInfo,
            ttl,
            keysInfo,
          );
        } else {
          await this.tokenService.revokeKeysInfo(
            AuthType.Oauth,
            tokenInfo.client,
            tokenInfo.authInfo,
          );
        }
      }
    });
  }
}
