import { AuthUsersServiceModule } from '@app/common/grpc/auth-users';
import { Global, Module } from '@nestjs/common';
import { TokenService } from './token.service';

@Global()
@Module({
  imports: [
    AuthUsersServiceModule.forRootAsync({ envFilePath: './apps/users/.env' }),
  ],
  providers: [TokenService],
  exports: [TokenService],
})
export class TokenModule {}
