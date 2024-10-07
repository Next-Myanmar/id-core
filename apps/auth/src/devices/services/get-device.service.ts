import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthTokenInfo } from '../../types/auth-token-info.interface';
import { GetDeviceDto } from '../dto/get-device.dto';
import { DeviceLoginHistoriesEntity } from '../entities/device-login-histories.entity';
import {
  convertToDeviceEntity,
  convertToLoginHistoryEntity,
} from '../utils/entity-utils';

@Injectable()
export class GetDeviceService {
  private readonly logger = new Logger(GetDeviceService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async getDevice(
    { client, authInfo }: AuthTokenInfo,
    getDeviceDto: GetDeviceDto,
  ): Promise<DeviceLoginHistoriesEntity> {
    const lifetime =
      authInfo.refreshTokenLifetime ||
      authInfo.accessTokenLifetime ||
      Number(this.config.getOrThrow('REFRESH_TOKEN_LIFETIME'));

    const currentTime = new Date();
    const lifetimeMilliseconds = lifetime * 1000;
    const passTime = new Date(currentTime.getTime() - lifetimeMilliseconds);

    const device = await this.prisma.device.findUniqueOrThrow({
      where: {
        id: getDeviceDto.deviceId,
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
          orderBy: { lastLogin: 'desc' },
          where: {
            lastLogin: {
              gt: passTime,
            },
          },
        },
      },
    });

    const deviceEntity = convertToDeviceEntity(device, authInfo.deviceId);

    const loginHistories = device.loginHistories
      .slice(1)
      .map((loginHistory) => convertToLoginHistoryEntity(loginHistory));

    return { ...deviceEntity, loginHistories };
  }
}
