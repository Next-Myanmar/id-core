import { hash } from '@app/common';
import { PasswordHistory, User, UsersPrismaService, UsersTransactionalPrismaClient } from '@app/prisma/users';

export async function createPasswordHistory(
  prisma: UsersPrismaService | UsersTransactionalPrismaClient,
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
  prisma: UsersTransactionalPrismaClient,
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
