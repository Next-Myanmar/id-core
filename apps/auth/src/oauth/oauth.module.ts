import { UsersOauthServiceModule } from '@app/grpc/users-oauth';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { CorsService } from '../services/cors.service';
import { TokenGeneratorService } from '../services/token-generator.service';
import { AuthenticateController } from './controllers/authenticate.controller';
import { AuthorizeController } from './controllers/authorize.controller';
import { GetUserController } from './controllers/get-user.controller';
import { IntrospectTokenController } from './controllers/introspect-token.controller';
import { LogoutController } from './controllers/logout.controller';
import { RevokeTokenController } from './controllers/revoke-token.controller';
import { TokenController } from './controllers/token.controller';
import { AuthenticateService } from './services/authenticate.service';
import { AuthorizeService } from './services/authorize/authorize.service';
import { CodeService } from './services/authorize/code.service';
import { GetUserService } from './services/get-user.service';
import { IntrospectTokenService } from './services/introspect-token.service';
import { LogoutService } from './services/logout.service';
import { RevokeTokenService } from './services/revoke-token.service';
import { AuthorizationCodeService } from './services/token/authorization-code.service';
import { RefreshTokenService } from './services/token/refresh-token.service';
import { TokenService } from './services/token/token.service';
import { AuthorizeGeneratorService } from './services/authorize-generator.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: './apps/auth/.env',
      isGlobal: true,
      validationSchema: Joi.object({
        OAUTH_AUTHORIZATION_CODE_LIFETIME: Joi.number().required(),
        OAUTH_ACCESS_TOKEN_LIFETIME: Joi.number().required(),
        OAUTH_REFRESH_TOKEN_LIFETIME: Joi.number().required(),

        GRPC_HOST_AUTH_OAUTH: Joi.string().required(),
        GRPC_PORT_AUTH_OAUTH: Joi.number().required(),
      }),
    }),
    UsersOauthServiceModule.forRootAsync({ envFilePath: './apps/auth/.env' }),
  ],
  controllers: [
    AuthorizeController,
    TokenController,
    AuthenticateController,
    LogoutController,
    GetUserController,
    RevokeTokenController,
    IntrospectTokenController,
  ],
  providers: [
    TokenGeneratorService,
    AuthorizeGeneratorService,
    CorsService,
    TokenService,
    CodeService,
    AuthorizeService,
    AuthorizationCodeService,
    RefreshTokenService,
    AuthenticateService,
    LogoutService,
    GetUserService,
    RevokeTokenService,
    IntrospectTokenService,
  ],
})
export class OauthModule {}
