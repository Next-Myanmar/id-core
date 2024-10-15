import { Logger } from '@nestjs/common';
import { Query, Resolver } from '@nestjs/graphql';
import { CurrentTokenInfo } from '../../decorators/current-token-info.decorator';
import { TokenInfo } from '../../types/token-info.interface';
import { DeviceEntity } from '../entities/device.entity';
import { GetDevicesService } from '../services/get-devices.service';

@Resolver()
export class GetDevicesResolver {
  private readonly logger = new Logger(GetDevicesResolver.name);

  constructor(private readonly getDevicesService: GetDevicesService) {}

  @Query(() => [DeviceEntity])
  async getDevices(
    @CurrentTokenInfo() tokenInfo: TokenInfo,
  ): Promise<DeviceEntity[]> {
    this.logger.log('Get Devices Start');

    const result = await this.getDevicesService.getDevices(tokenInfo);

    this.logger.log('Get Devices End');

    return result;
  }
}
