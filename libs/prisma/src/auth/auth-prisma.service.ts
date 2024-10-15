import { PrismaErrorCodes } from '@app/common';
import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { AuthTransactionalPrismaClient } from './auth-transactional-prisma-client';
import { Prisma, PrismaClient } from './generated';

@Injectable()
export class AuthPrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(AuthPrismaService.name);

  async onModuleInit() {
    await this.$connect();

    this.logger.log('Connected to the database');
  }

  async onModuleDestroy() {
    await this.$disconnect();

    this.logger.log('Disconnected from the database');
  }

  async transaction<T>(
    callback: (prisma: AuthTransactionalPrismaClient) => Promise<T>,
  ): Promise<T> {
    const MAX_RETRIES = 5;
    let retries = 0;
    let lastError: any;

    while (retries < MAX_RETRIES) {
      try {
        const result = await this.$transaction(async (prisma) => {
          return await callback(prisma);
        });

        return result;
      } catch (error: any) {
        lastError = error;
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (
            error.code === PrismaErrorCodes.TRANSACTION_FAILED ||
            error.code === PrismaErrorCodes.TRANSACTION_ALREADY_CLOSED
          ) {
            retries++;
            this.logger.log(`Prisma Transaction Failed Retry: ${retries}`);
            continue;
          }
        }
        throw error;
      }
    }

    if (retries === MAX_RETRIES) {
      throw lastError;
    }
  }
}
