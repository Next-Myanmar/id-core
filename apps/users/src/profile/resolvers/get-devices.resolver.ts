import { Logger } from '@nestjs/common';
import { Query, Resolver } from '@nestjs/graphql';
import { CurrentAuthInfo } from '../../decorators/current-auth-info.decorator';
import { AuthInfo } from '../../types/auth-info.interface';
import { DeviceEntity } from '../entities/device.entity';
import { GetDevicesService } from '../services/get-devices.service';

@Resolver()
export class GetDevicesResolver {
  private readonly logger = new Logger(GetDevicesResolver.name);

  constructor(private readonly getDevicesService: GetDevicesService) {}

  @Query(() => [DeviceEntity])
  async getDevices(
    @CurrentAuthInfo() { authUser }: AuthInfo,
  ): Promise<DeviceEntity[]> {
    this.logger.log('Get Devices Start');

    const result = await this.getDevicesService.getDevices(authUser);

    this.logger.log('Get Devices End');

    return result;
  }
}
