import { AuthUser } from '@app/common/grpc/auth-users';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TokenService } from '../../services/token.service';
import { getTokenFromAuthorization } from '../../utils/utils';
import { AuthenticateDto } from '../dto/authenticate.dto';

@Injectable()
export class AuthenticateService {
  private readonly logger = new Logger(AuthenticateService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
  ) {}

  async authenticate(authenticateDto: AuthenticateDto): Promise<AuthUser> {
    this.logger.debug(`AuthenticateDto: ${JSON.stringify(authenticateDto)}`);

    const accessToken = getTokenFromAuthorization(
      authenticateDto.authorization,
    );

    const tokenInfo = await this.tokenService.getAccessToken(accessToken);

    if (!tokenInfo) {
      throw new UnauthorizedException();
    }

    const deviceId = tokenInfo.authInfo.deviceId;
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
      userId: tokenInfo.authInfo.userId,
      deviceId: tokenInfo.authInfo.deviceId,
      tokenType: tokenInfo.authInfo.tokenType,
    };
  }
}
