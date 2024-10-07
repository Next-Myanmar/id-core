import { PrismaErrorCodes } from '@app/common';
import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Prisma, PrismaClient } from './generated';
import { TransactionalPrismaClient } from './transactional-prisma-client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    await this.$connect();

    this.logger.log('Connected to the database');
  }

  async onModuleDestroy() {
    await this.$disconnect();

    this.logger.log('Disconnected from the database');
  }

  async transaction<T>(
    callback: (prisma: TransactionalPrismaClient) => Promise<T>,
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
