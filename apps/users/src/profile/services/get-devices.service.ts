import { AuthUser, TokenType } from '@app/common/grpc/auth-users';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { TokenService } from '../../token/token.service';
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

  async getDevices(authUser: AuthUser): Promise<DeviceEntity[]> {
    const daysAgo = new Date(
      new Date().getTime() -
        Number(this.config.getOrThrow<number>('NORMAL_REFRESH_LIFETIME')),
    );

    const devices = await this.prisma.device.findMany({
      where: { userId: authUser.userId },
      include: {
        loginHistories: {
          where: {
            lastLogin: {
              gte: daysAgo,
              lte: new Date(),
            },
          },
          orderBy: { lastLogin: 'desc' },
          take: 1,
        },
      },
    });

    const generatedTokens = devices.map((device) => ({
      userId: device.userId,
      deviceId: device.id,
      tokenType: TokenType.Normal,
    }));

    const availableTokens =
      await this.token.checkAvailableTokens(generatedTokens);

    const filteredDevices = devices.filter((device) =>
      availableTokens.some(
        (token) =>
          token.userId === device.userId && token.deviceId === device.id,
      ),
    );

    const sortedDevices = filteredDevices.slice().sort((a, b) => {
      const lastLoginA = a.loginHistories[0]?.lastLogin?.getTime() ?? 0;
      const lastLoginB = b.loginHistories[0]?.lastLogin?.getTime() ?? 0;
      return lastLoginB - lastLoginA;
    });

    return sortedDevices.map((device) =>
      convertToDeviceEntity(device, authUser.deviceId),
    );
  }
}
