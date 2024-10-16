import { Global, Module } from '@nestjs/common';
import { UsersPrismaService } from './users-prisma.service';

@Global()
@Module({
  providers: [UsersPrismaService],
  exports: [UsersPrismaService],
})
export class UsersPrismaModule {}
