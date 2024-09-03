import { Module } from '@nestjs/common';
import { TestUsersController } from './controllers/test-users.controller';
import { LogoutService } from './services/logout.service';

@Module({
  imports: [],
  controllers: [TestUsersController],
  providers: [LogoutService],
})
export class TestUsersModule {}
