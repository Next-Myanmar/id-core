import { Logger } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { CurrentAuthTokenInfo } from '../../decorators/current-auth-token-info.decorator';
import { AuthTokenInfo } from '../../types/auth-token-info.interface';
import { GetDeviceDto } from '../dto/get-device.dto';
import { DeviceLoginHistoriesEntity } from '../entities/device-login-histories.entity';
import { GetDeviceService } from '../services/get-device.service';
@Resolver()
export class GetDeviceResolver {
  private readonly logger = new Logger(GetDeviceResolver.name);

  constructor(private readonly getDeviceService: GetDeviceService) {}

  @Query(() => DeviceLoginHistoriesEntity)
  async getDevice(
    @CurrentAuthTokenInfo() authTokenInfo: AuthTokenInfo,
    @Args('getDeviceDto') getDeviceDto: GetDeviceDto,
  ): Promise<DeviceLoginHistoriesEntity> {
    this.logger.log('Get Device Start');

    const result = await this.getDeviceService.getDevice(
      authTokenInfo,
      getDeviceDto,
    );

    this.logger.log('Get Device End');

    return result;
  }
}
