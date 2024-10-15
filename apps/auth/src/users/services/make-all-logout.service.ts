import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthType } from '../../enums/auth-type.enum';
import { TokensService } from '../../services/tokens.service';
import { MakeAllLogoutDto } from '../dto/male-all-logout.dto';
import { AuthPrismaService } from '@app/prisma/auth';

@Injectable()
export class MakeAllLogoutService {
  private readonly logger = new Logger(MakeAllLogoutService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: AuthPrismaService,
    private readonly token: TokensService,
  ) {}

  async makeAllLogout(makeAllLogoutDto: MakeAllLogoutDto) {
    const currentTime = new Date();
    const lifetimeMilliseconds = makeAllLogoutDto.refreshTokenLifetime * 1000;
    const passTime = new Date(currentTime.getTime() - lifetimeMilliseconds);

    const clientId = this.config.getOrThrow('USERS_APP_CLIENT_OAUTH_ID');

    const devices = await this.prisma.device.findMany({
      where: {
        id: {
          not: makeAllLogoutDto.currentDeviceId,
        },
        clientOauthId: clientId,
        userId: makeAllLogoutDto.userId,
        loginHistories: {
          some: {
            lastLogin: {
              gt: passTime,
            },
          },
        },
      },
      include: {
        loginHistories: {
          where: {
            lastLogin: {
              gt: passTime,
            },
          },
          orderBy: { lastLogin: 'desc' },
          take: 1,
        },
      },
    });

    const keys = devices.map((device) =>
      this.token.getKeysInfoKey(
        AuthType.Users,
        device.clientOauthId,
        device.userId,
        device.id,
      ),
    );

    await this.token.transaction(async () => {
      for (const key of keys) {
        await this.token.revokeKeysInfoByKey(key);
      }
    });
  }
}
