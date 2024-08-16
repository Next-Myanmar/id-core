import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { AuthenticateController } from './controllers/authenticate.controller';
import { GenerateTokenPairController } from './controllers/generate-token-pair.controller';
import { AuthenticateService } from './services/authenticate.service';
import { GenerateTokenPairService } from './services/generate-token-pair.service';

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
  ],
  controllers: [GenerateTokenPairController, AuthenticateController],
  providers: [GenerateTokenPairService, AuthenticateService],
})
export class UsersModule {}
