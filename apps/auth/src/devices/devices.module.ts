import { Module } from '@nestjs/common';
import { TokenGeneratorService } from '../services/token-generator.service';
import { GetDeviceResolver } from './resolvers/get-device.resolver';
import { GetDevicesResolver } from './resolvers/get-devices.resolver';
import { MakeLogoutResolver } from './resolvers/make-logout.resolver';
import { GetDeviceService } from './services/get-device.service';
import { GetDevicesService } from './services/get-devices.service';
import { MakeLogoutService } from './services/make-logout.service';

@Module({
  imports: [],
  controllers: [],
  providers: [
    TokenGeneratorService,
    GetDevicesService,
    GetDevicesResolver,
    GetDeviceService,
    GetDeviceResolver,
    MakeLogoutService,
    MakeLogoutResolver,
  ],
})
export class DevicesModule {}
