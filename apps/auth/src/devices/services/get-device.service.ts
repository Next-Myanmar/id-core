import { AuthPrismaService } from '@app/prisma/auth';
import { Injectable, Logger } from '@nestjs/common';
import { TokenInfo } from '../../types/token-info.interface';
import { GetDeviceDto } from '../dto/get-device.dto';
import { DeviceLoginHistoriesEntity } from '../entities/device-login-histories.entity';
import {
  convertToDeviceEntity,
  convertToLoginHistoryEntity,
} from '../utils/entity-utils';

@Injectable()
export class GetDeviceService {
  private readonly logger = new Logger(GetDeviceService.name);

  constructor(private readonly prisma: AuthPrismaService) {}

  async getDevice(
    tokenInfo: TokenInfo,
    getDeviceDto: GetDeviceDto,
  ): Promise<DeviceLoginHistoriesEntity> {
    const lifetime =
      tokenInfo.refreshTokenLifetime || tokenInfo.accessTokenLifetime;

    const currentTime = new Date();
    const lifetimeMilliseconds = lifetime * 1000;
    const passTime = new Date(currentTime.getTime() - lifetimeMilliseconds);

    const device = await this.prisma.device.findUniqueOrThrow({
      where: {
        id: getDeviceDto.deviceId,
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
          orderBy: { lastLogin: 'desc' },
          where: {
            lastLogin: {
              gt: passTime,
            },
          },
        },
      },
    });

    const deviceEntity = convertToDeviceEntity(
      device,
      tokenInfo.authInfo.deviceId,
    );

    const loginHistories = device.loginHistories
      .slice(1)
      .map((loginHistory) => convertToLoginHistoryEntity(loginHistory));

    return { ...deviceEntity, loginHistories };
  }
}
