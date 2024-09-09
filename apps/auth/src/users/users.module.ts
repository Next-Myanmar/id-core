import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { AuthenticateController } from './controllers/authenticate.controller';
import { CheckAvailableTokensController } from './controllers/check-available-tokens.controller';
import { GenerateTokenPairController } from './controllers/generate-token-pair.controller';
import { LogoutController } from './controllers/logout.controller';
import { MakeLogoutController } from './controllers/make-logout.controller';
import { RefreshTokenController } from './controllers/refresh-token.controller';
import { AuthenticateService } from './services/authenticate.service';
import { CheckAvailableTokensService } from './services/check-available-tokens.service';
import { GenerateTokenPairService } from './services/generate-token-pair.service';
import { LogoutService } from './services/logout.service';
import { MakeLogoutService } from './services/make-logout.service';
import { RefreshTokenService } from './services/refresh-token.service';
import { TokenService } from './services/token.service';
import { TestUsersModule } from './test-users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: './apps/auth/.env',
      isGlobal: true,
      validationSchema: Joi.object({
        GRPC_HOST_USERS: Joi.string().required(),
        GRPC_PORT_USERS: Joi.number().required(),
      }),
    }),
    ...(process.env.NODE_ENV === 'development' ? [TestUsersModule] : []),
  ],
  controllers: [
    GenerateTokenPairController,
    AuthenticateController,
    RefreshTokenController,
    LogoutController,
    CheckAvailableTokensController,
    MakeLogoutController,
  ],
  providers: [
    TokenService,
    GenerateTokenPairService,
    AuthenticateService,
    RefreshTokenService,
    LogoutService,
    CheckAvailableTokensService,
    MakeLogoutService,
  ],
})
export class UsersModule {}
