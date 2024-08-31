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
