import { UsersNotificationsModule } from '@app/common/rmq/notifications/users';
import { Module } from '@nestjs/common';
import { TestUsersController } from './controllers/test-users.controller';

@Module({
  imports: [
    UsersNotificationsModule.forRootAsync({
      envFilePath: './apps/notifications/.env',
    }),
  ],
  controllers: [TestUsersController],
  providers: [],
})
export class TestUsersModule {}
