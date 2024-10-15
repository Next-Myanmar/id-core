import { Logger } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { CurrentTokenInfo } from '../../decorators/current-token-info.decorator';
import { TokenInfo } from '../../types/token-info.interface';
import { GetDeviceDto } from '../dto/get-device.dto';
import { DeviceLoginHistoriesEntity } from '../entities/device-login-histories.entity';
import { GetDeviceService } from '../services/get-device.service';
@Resolver()
export class GetDeviceResolver {
  private readonly logger = new Logger(GetDeviceResolver.name);

  constructor(private readonly getDeviceService: GetDeviceService) {}

  @Query(() => DeviceLoginHistoriesEntity)
  async getDevice(
    @CurrentTokenInfo() tokenInfo: TokenInfo,
    @Args('getDeviceDto') getDeviceDto: GetDeviceDto,
  ): Promise<DeviceLoginHistoriesEntity> {
    this.logger.log('Get Device Start');

    const result = await this.getDeviceService.getDevice(
      tokenInfo,
      getDeviceDto,
    );

    this.logger.log('Get Device End');

    return result;
  }
}
