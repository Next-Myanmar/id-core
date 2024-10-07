import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Device, LoginHistory } from '../../prisma/generated';
import { PrismaService } from '../../prisma/prisma.service';
import { TokenService } from '../../services/token.service';
import { AuthTokenInfo } from '../../types/auth-token-info.interface';
import { DeviceEntity } from '../entities/device.entity';
import { convertToDeviceEntity } from '../utils/entity-utils';

@Injectable()
export class GetDevicesService {
  private readonly logger = new Logger(GetDevicesService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly token: TokenService,
  ) {}

  async getDevices({
    client,
    authInfo,
  }: AuthTokenInfo): Promise<DeviceEntity[]> {
    const lifetime =
      authInfo.refreshTokenLifetime ||
      authInfo.accessTokenLifetime ||
      Number(this.config.getOrThrow('REFRESH_TOKEN_LIFETIME'));

    const currentTime = new Date();
    const lifetimeMilliseconds = lifetime * 1000;
    const passTime = new Date(currentTime.getTime() - lifetimeMilliseconds);

    let devices = await this.prisma.device.findMany({
      where: {
        clientOauthId: client.id,
        userId: authInfo.userId,
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
      convertToDeviceEntity(device, authInfo.deviceId),
    );
  }
}
