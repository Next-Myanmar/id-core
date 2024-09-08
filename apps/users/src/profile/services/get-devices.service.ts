import { AuthUser } from '@app/common/grpc/auth-users';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DeviceEntity } from '../entities/device.entity';
import { convertToDeviceEntity } from '../utils/entity-utils';

@Injectable()
export class GetDevicesService {
  private readonly logger = new Logger(GetDevicesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getDevices(authUser: AuthUser): Promise<DeviceEntity[]> {
    const devices = await this.prisma.device.findMany({
      where: { userId: authUser.userId },
      include: {
        loginHistories: { orderBy: { lastLogin: 'desc' }, take: 1 },
      },
    });

    const sortedDevices = [...devices].sort((a, b) => {
      const lastLoginA = a.loginHistories[0]?.lastLogin ?? new Date(0);
      const lastLoginB = b.loginHistories[0]?.lastLogin ?? new Date(0);

      return lastLoginB.getTime() - lastLoginA.getTime();
    });

    return sortedDevices.map((device) =>
      convertToDeviceEntity(device, authUser.deviceId),
    );
  }
}
