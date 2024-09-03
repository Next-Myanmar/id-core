import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { GetProfileResolver } from './resolvers/get-profile.resolver';
import { UpdateProfileResolver } from './resolvers/update-profile.resolver';
import { GetProfileService } from './services/get-profile.service';
import { UpdateProfileService } from './services/update-profile.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: './apps/users/.env',
      isGlobal: true,
      validationSchema: Joi.object({}),
    }),
  ],
  providers: [
    GetProfileService,
    GetProfileResolver,
    UpdateProfileService,
    UpdateProfileResolver,
  ],
})
export class ProfileModule {}
