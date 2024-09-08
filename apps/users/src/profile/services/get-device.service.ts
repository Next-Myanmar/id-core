import { AuthUser } from '@app/common/grpc/auth-users';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GetDeviceDto } from '../dto/get-device.dto';
import { DeviceLoginHistoriesEntity } from '../entities/device-login-histories.entity';
import {
  convertToDeviceEntity,
  convertToLoginHistoryEntity,
} from '../utils/entity-utils';

@Injectable()
export class GetDeviceService {
  private readonly logger = new Logger(GetDeviceService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getDevice(
    authUser: AuthUser,
    getDeviceDto: GetDeviceDto,
  ): Promise<DeviceLoginHistoriesEntity> {
    const device = await this.prisma.device.findUniqueOrThrow({
      where: {
        id: getDeviceDto.deviceId,
        userId: authUser.userId,
      },
      include: { loginHistories: { orderBy: { lastLogin: 'desc' } } },
    });

    const deviceEntity = convertToDeviceEntity(device, authUser.deviceId);

    const loginHistories = device.loginHistories
      .slice(1)
      .map((loginHistory) => convertToLoginHistoryEntity(loginHistory));

    return { ...deviceEntity, loginHistories };
  }
}
