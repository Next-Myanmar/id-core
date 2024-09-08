import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { ChangePasswordResolver } from './resolvers/change-password.resolver';
import { GetDeviceResolver } from './resolvers/get-device.resolver';
import { GetDevicesResolver } from './resolvers/get-devices.resolver';
import { GetPersonalDetailsResolver } from './resolvers/get-personal-details.resolver';
import { UpdatePersonalDetailsResolver } from './resolvers/update-personal-details.resolver';
import { ChangePasswordService } from './services/chage-password.service';
import { GetDeviceService } from './services/get-device.service';
import { GetDevicesService } from './services/get-devices.service';
import { GetPersonalDetailsService } from './services/get-personal-details.service';
import { UpdatePersonalDetailsService } from './services/update-personal-details.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: './apps/users/.env',
      isGlobal: true,
      validationSchema: Joi.object({}),
    }),
  ],
  controllers: [],
  providers: [
    GetPersonalDetailsService,
    GetPersonalDetailsResolver,
    UpdatePersonalDetailsService,
    UpdatePersonalDetailsResolver,
    ChangePasswordService,
    ChangePasswordResolver,
    GetDevicesService,
    GetDevicesResolver,
    GetDeviceService,
    GetDeviceResolver,
  ],
})
export class ProfileModule {}
