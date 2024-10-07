import { Module } from '@nestjs/common';
import { TokenService } from '../services/token.service';
import { GetDevicesResolver } from './resolvers/get-devices.resolver';
import { MakeLogoutResolver } from './resolvers/make-logout.resolver';
import { GetDevicesService } from './services/get-devices.service';
import { GetDeviceService } from './services/get-device.service';
import { GetDeviceResolver } from './resolvers/get-device.resolver';
import { MakeLogoutService } from './services/make-logout.service';

@Module({
  imports: [],
  controllers: [],
  providers: [
    TokenService,
    GetDevicesService,
    GetDevicesResolver,
    GetDeviceService,
    GetDeviceResolver,
    MakeLogoutService,
    MakeLogoutResolver,
  ],
})
export class DevicesModule {}
