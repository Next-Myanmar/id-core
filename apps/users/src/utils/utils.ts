import { hash } from '@app/common';
import { PasswordHistory, User } from '../prisma/generated';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionalPrismaClient } from '../prisma/transactional-prisma-client';

export async function createPasswordHistory(
  prisma: PrismaService | TransactionalPrismaClient,
  userId: string,
  deviceId: string,
): Promise<PasswordHistory> {
  const result = await prisma.passwordHistory.create({
    data: {
      userId: userId,
      deviceId: deviceId,
    },
  });

  return result;
}

export async function updateUserPassword(
  prisma: TransactionalPrismaClient,
  userId: string,
  deviceId: string,
  newPassword: string,
): Promise<{ user: User; passwordHistory: PasswordHistory }> {
  const hashedPassword = await hash(newPassword);

  const user = await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  const passwordHistory = await createPasswordHistory(prisma, userId, deviceId);

  return { user, passwordHistory };
}
