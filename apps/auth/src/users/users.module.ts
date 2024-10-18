import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { TokenGeneratorService } from '../services/token-generator.service';
import { AuthenticateController } from './controllers/authenticate.controller';
import { GenerateTokenPairController } from './controllers/generate-token-pair.controller';
import { LogoutController } from './controllers/logout.controller';
import { MakeAllLogoutController } from './controllers/make-all-logout.controller';
import { RefreshTokenController } from './controllers/refresh-token.controller';
import { AuthenticateService } from './services/authenticate.service';
import { GenerateTokenPairService } from './services/generate-token-pair.service';
import { LogoutService } from './services/logout.service';
import { MakeAllLogoutService } from './services/make-all-logout.service';
import { RefreshTokenService } from './services/refresh-token.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: './apps/auth/.env',
      isGlobal: true,
      validationSchema: Joi.object({
        USERS_APP_CLIENT_OAUTH_ID: Joi.string().required(),
        GRPC_HOST_AUTH_USERS: Joi.string().required(),
        GRPC_PORT_AUTH_USERS: Joi.number().required(),
      }),
    }),
  ],
  controllers: [
    GenerateTokenPairController,
    AuthenticateController,
    RefreshTokenController,
    LogoutController,
    MakeAllLogoutController,
  ],
  providers: [
    TokenGeneratorService,
    GenerateTokenPairService,
    AuthenticateService,
    RefreshTokenService,
    LogoutService,
    MakeAllLogoutService,
  ],
})
export class UsersModule {}
