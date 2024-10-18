import {
  compareHash,
  I18nValidationException,
  i18nValidationMessage,
} from '@app/common';
import { AuthOauthUser } from '@app/grpc/auth-oauth';
import { AuthPrismaService } from '@app/prisma/auth';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { AuthType } from '../../enums/auth-type.enum';
import { TokenGeneratorService } from '../../services/token-generator.service';
import { AuthOauthInfo } from '../../types/auth-oauth-info.interface';
import { getTokenFromAuthorization } from '../../utils/utils';

@Injectable()
export class AuthenticateService {
  private readonly logger = new Logger(AuthenticateService.name);

  constructor(
    private readonly prisma: AuthPrismaService,
    private readonly tokenService: TokenGeneratorService,
  ) {}

  async authenticate(
    clientId: string,
    clientSecret: string,
    authorization: string,
  ): Promise<AuthOauthUser> {
    await this.checkClient(clientId, clientSecret);

    const accessToken = getTokenFromAuthorization(authorization);

    const tokenInfo = await this.tokenService.getAccessToken(
      AuthType.Oauth,
      accessToken,
    );

    if (!tokenInfo) {
      throw new UnauthorizedException();
    }

    if (tokenInfo.client.clientId !== clientId) {
      throw I18nValidationException.create({
        property: 'client_id',
        message: i18nValidationMessage({
          property: 'property.client_id',
          message: 'validation.INVALID',
        }),
      });
    }

    const authInfo: AuthOauthInfo = tokenInfo.authInfo as AuthOauthInfo;

    const deviceId = authInfo.deviceId;
    const geoip = '192.168.0.1';

    await this.prisma.loginHistory.upsert({
      where: { deviceId_geoip: { deviceId, geoip } },
      update: {
        lastLogin: new Date(),
      },
      create: {
        deviceId,
        geoip,
        lastLogin: new Date(),
        country: 'Japan',
        subDivision1: 'Itabashi',
        subDivision2: 'Takashimadaira',
        city: 'Tokyo',
      },
    });

    return {
      userId: authInfo.oauthUserId,
      profile: authInfo.profile,
    };
  }

  async checkClient(clientId: string, clientSecret: string): Promise<void> {
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
}
