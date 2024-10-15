import {
  I18nValidationException,
  i18nValidationMessage,
  UserAgentDetails,
} from '@app/common';
import { AuthPrismaService } from '@app/prisma/auth';
import { Injectable, Logger } from '@nestjs/common';
import { Grant, GrantHelper } from 'apps/auth/src/enums/grant.enum';
import { Request } from 'express';
import { ClientOauth } from '../../../types/client-oauth.interface';
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
    req: Request,
    userAgentDetails: UserAgentDetails,
    generateTokenPairDto: TokenDto,
  ): Promise<TokenPairResponse> {
    this.logger.log(`Grant Type: ${generateTokenPairDto.grant_type}`);

    await this.checkClient(
      generateTokenPairDto.client_id,
      generateTokenPairDto.client_secret,
      generateTokenPairDto.grant_type,
    );

    if (generateTokenPairDto.grant_type === Grant.AuthorizationCode) {
      return await this.authorizationCode.handleAuthorizationCode(
        generateTokenPairDto,
        userAgentDetails,
      );
    }

    if (generateTokenPairDto.grant_type === Grant.RefreshToken) {
      return await this.refreshToken.handleRefreshToken(
        req,
        generateTokenPairDto,
        userAgentDetails,
      );
    }

    return null;
  }

  private async checkClient(
    clientId: string,
    clientSecret: string,
    grantType: Grant,
  ): Promise<ClientOauth> {
    const client = await this.prisma.clientOauth.findUnique({
      where: {
        clientId,
        clientSecrets: {
          some: {
            secret: clientSecret,
            isDeleted: false,
          },
        },
        grants: {
          has: GrantHelper.convertToGrantPrisma(grantType),
        },
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

    return {
      ...client,
      grants: client.grants.map((grant) => GrantHelper.convertToGrant(grant)),
    };
  }
}
