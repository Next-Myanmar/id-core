import { Module } from '@nestjs/common';
import { TestUsersController } from './controllers/test-users.controller';
import { LogoutService } from './services/logout.service';
import { TokenService } from './services/token.service';

@Module({
  imports: [],
  controllers: [TestUsersController],
  providers: [TokenService, LogoutService],
})
export class TestUsersModule {}
