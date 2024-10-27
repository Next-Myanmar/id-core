import { AuthUser } from '@app/grpc/auth-users';
import { AuthPrismaService } from '@app/prisma/auth';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { AuthType } from '../../enums/auth-type.enum';
import { TokenGeneratorService } from '../../services/token-generator.service';
import { AuthUsersInfo } from '../../types/users-auth-info.interface';
import { getTokenFromAuthorization } from '../../utils/utils';
import { AuthenticateDto } from '../dto/authenticate.dto';

@Injectable()
export class AuthenticateService {
  private readonly logger = new Logger(AuthenticateService.name);

  constructor(
    private readonly prisma: AuthPrismaService,
    private readonly tokenService: TokenGeneratorService,
  ) {}

  async authenticate(authenticateDto: AuthenticateDto): Promise<AuthUser> {
    this.logger.debug(`AuthenticateDto: ${JSON.stringify(authenticateDto)}`);

    const accessToken = getTokenFromAuthorization(
      authenticateDto.authorization,
    );

    const tokenInfo = await this.tokenService.getAccessToken(
      AuthType.Users,
      accessToken,
    );

    if (!tokenInfo) {
      throw new UnauthorizedException();
    }

    if (tokenInfo.accessTokenExpiresAt < Date.now()) {
      this.logger.debug('The access token has been expired.');
      throw new UnauthorizedException();
    }

    const authInfo: AuthUsersInfo = tokenInfo.authInfo as AuthUsersInfo;

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
      userId: authInfo.userId,
      deviceId: authInfo.deviceId,
      tokenType: authInfo.tokenType,
    };
  }
}
