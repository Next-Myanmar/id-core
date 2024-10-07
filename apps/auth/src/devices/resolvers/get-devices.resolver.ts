import { Logger } from '@nestjs/common';
import { Query, Resolver } from '@nestjs/graphql';
import { CurrentAuthTokenInfo } from '../../decorators/current-auth-token-info.decorator';
import { AuthTokenInfo } from '../../types/auth-token-info.interface';
import { DeviceEntity } from '../entities/device.entity';
import { GetDevicesService } from '../services/get-devices.service';

@Resolver()
export class GetDevicesResolver {
  private readonly logger = new Logger(GetDevicesResolver.name);

  constructor(private readonly getDevicesService: GetDevicesService) {}

  @Query(() => [DeviceEntity])
  async getDevices(
    @CurrentAuthTokenInfo() authTokenInfo: AuthTokenInfo,
  ): Promise<DeviceEntity[]> {
    this.logger.log('Get Devices Start');

    const result = await this.getDevicesService.getDevices(authTokenInfo);

    this.logger.log('Get Devices End');

    return result;
  }
}
