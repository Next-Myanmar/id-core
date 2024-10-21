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

  async authenticate(authorization: string): Promise<AuthOauthUser> {
    const accessToken = getTokenFromAuthorization(authorization);

    const tokenInfo = await this.tokenService.getAccessToken(
      AuthType.Oauth,
      accessToken,
    );

    if (!tokenInfo) {
      throw new UnauthorizedException();
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
}
