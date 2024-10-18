import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { GetProfileController } from './controllers/get-profile.controller';
import { GetProfileService } from './services/get-data.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: './apps/users/.env',
      isGlobal: true,
      validationSchema: Joi.object({
        GRPC_HOST_USERS_OAUTH: Joi.string().required(),
        GRPC_PORT_USERS_OAUTH: Joi.number().required(),
      }),
    }),
  ],
  controllers: [GetProfileController],
  providers: [GetProfileService],
})
export class OauthModule {}
