import { UsersOauthServiceModule } from '@app/common/grpc/users-oauth';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { TokensService } from '../services/tokens.service';
import { AuthorizeController } from './controllers/authorize.controller';
import { TokenController } from './controllers/token.controller';
import { AuthorizeService } from './services/authorize/authorize.service';
import { CodeService } from './services/authorize/code.service';
import { AuthorizationCodeService } from './services/token/authorization-code.service';
import { RefreshTokenService } from './services/token/refresh-token.service';
import { TokenService } from './services/token/token.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: './apps/auth/.env',
      isGlobal: true,
      validationSchema: Joi.object({
        OAUTH_AUTHORIZATION_CODE_LIFETIME: Joi.number().required(),
        OAUTH_ACCESS_TOKEN_LIFETIME: Joi.number().required(),
        OAUTH_REFRESH_TOKEN_LIFETIME: Joi.number().required(),
      }),
    }),
    UsersOauthServiceModule.forRootAsync({ envFilePath: './apps/auth/.env' }),
  ],
  controllers: [AuthorizeController, TokenController],
  providers: [
    TokenService,
    CodeService,
    AuthorizeService,
    AuthorizationCodeService,
    RefreshTokenService,
    TokensService,
  ],
})
export class OauthModule {}
