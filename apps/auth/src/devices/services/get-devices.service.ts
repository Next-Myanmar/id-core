import { AuthPrismaService, Device, LoginHistory } from '@app/prisma/auth';
import { Injectable, Logger } from '@nestjs/common';
import { TokensService } from '../../services/tokens.service';
import { TokenInfo } from '../../types/token-info.interface';
import { DeviceEntity } from '../entities/device.entity';
import { convertToDeviceEntity } from '../utils/entity-utils';

@Injectable()
export class GetDevicesService {
  private readonly logger = new Logger(GetDevicesService.name);

  constructor(
    private readonly prisma: AuthPrismaService,
    private readonly token: TokensService,
  ) {}

  async getDevices(tokenInfo: TokenInfo): Promise<DeviceEntity[]> {
    const lifetime =
      tokenInfo.refreshTokenLifetime || tokenInfo.accessTokenLifetime;

    const currentTime = new Date();
    const lifetimeMilliseconds = lifetime * 1000;
    const passTime = new Date(currentTime.getTime() - lifetimeMilliseconds);

    let devices = await this.prisma.device.findMany({
      where: {
        clientOauthId: tokenInfo.client.id,
        userId: tokenInfo.authInfo.userId,
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

    const keys: { [key: string]: Device & { loginHistories: LoginHistory[] } } =
      devices.reduce(
        (acc, device) => {
          const key = this.token.getKeysInfoKey(
            tokenInfo.authType,
            device.clientOauthId,
            device.userId,
            device.id,
          );

          acc[key] = device;

          return acc;
        },
        {} as { [key: string]: Device & { loginHistories: LoginHistory[] } },
      );

    devices = Object.values(await this.token.checkAvailableKeysInfos(keys));

    const sortedDevices = devices.slice().sort((a, b) => {
      const lastLoginA = a.loginHistories[0].lastLogin?.getTime();
      const lastLoginB = b.loginHistories[0].lastLogin?.getTime();
      return lastLoginB - lastLoginA;
    });

    return sortedDevices.map((device) =>
      convertToDeviceEntity(device, tokenInfo.authInfo.deviceId),
    );
  }
}
