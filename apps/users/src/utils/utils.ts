import { NotFoundException } from '@nestjs/common';
import { LoginHistory } from '../prisma/generated';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionalPrismaClient } from '../prisma/transactional-prisma-client';

export async function updateLoginHistory(
  prisma: PrismaService | TransactionalPrismaClient,
  deviceId: string,
): Promise<LoginHistory> {
  const geoip = '192.168.0.1';

  return await prisma.loginHistory.upsert({
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
}

export async function updateDeviceIsLogined(
  prisma: TransactionalPrismaClient,
  userId: string,
  deviceIds: string[],
  isLoginedTobe: boolean,
  isLoginedCondition?: boolean,
): Promise<void> {
  const updates = await prisma.device.updateMany({
    where: {
      userId: userId,
      isLogined: isLoginedCondition,
      id: {
        in: deviceIds,
      },
    },
    data: {
      isLogined: isLoginedTobe,
    },
  });

  if (updates.count != deviceIds.length) {
    throw new NotFoundException();
  }
}
