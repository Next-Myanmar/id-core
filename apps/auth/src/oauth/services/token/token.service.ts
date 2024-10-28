import {
  compareHash,
  CorsDeniedException,
  I18nValidationException,
  i18nValidationMessage,
  UserAgentDetails,
} from '@app/common';
import { AuthPrismaService, ClientOauth } from '@app/prisma/auth';
import { Injectable, Logger } from '@nestjs/common';
import { Grant, GrantHelper } from 'apps/auth/src/enums/grant.enum';
import { TokenDto } from '../../dto/token.dto';
import { TokenPairResponse } from '../../types/token-pair-response.interface';
import { AuthorizationCodeService } from './authorization-code.service';
import { RefreshTokenService } from './refresh-token.service';

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);

  constructor(
    private readonly prisma: AuthPrismaService,
    private readonly authorizationCode: AuthorizationCodeService,
    private readonly refreshToken: RefreshTokenService,
  ) {}

  async token(
    userAgentDetails: UserAgentDetails,
    origin: string | null,
    generateTokenPairDto: TokenDto,
  ): Promise<TokenPairResponse> {
    this.logger.log(`Grant Type: ${generateTokenPairDto.grant_type}`);

    const client = await this.getClient(
      generateTokenPairDto.client_id,
      generateTokenPairDto.client_secret,
      generateTokenPairDto.grant_type,
      origin,
    );

    if (generateTokenPairDto.grant_type === Grant.AuthorizationCode) {
      return await this.authorizationCode.handleAuthorizationCode(
        client,
        generateTokenPairDto,
        userAgentDetails,
      );
    }

    if (generateTokenPairDto.grant_type === Grant.RefreshToken) {
      return await this.refreshToken.handleRefreshToken(
        client,
        generateTokenPairDto,
        userAgentDetails,
      );
    }

    return null;
  }

  private async getClient(
    clientId: string,
    clientSecret: string,
    grantType: Grant,
    origin: string | null,
  ): Promise<ClientOauth> {
    const client = await this.prisma.clientOauth.findUnique({
      where: {
        clientId,
        clientSecrets: {
          some: {
            isDeleted: false,
          },
        },
        grants: {
          has: GrantHelper.convertToGrantPrisma(grantType),
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

    if (origin && origin !== client.homeUri) {
      throw new CorsDeniedException(origin, client.clientId);
    }

    return client;
  }
}
