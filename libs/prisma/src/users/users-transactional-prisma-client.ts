import { PrismaClient } from './generated';

export type UsersTransactionalPrismaClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;
