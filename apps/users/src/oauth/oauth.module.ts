import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { GetDataController } from './controllers/get-data.controller';
import { GetDataService } from './services/get-data.service';

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
  controllers: [GetDataController],
  providers: [GetDataService],
})
export class OauthModule {}
