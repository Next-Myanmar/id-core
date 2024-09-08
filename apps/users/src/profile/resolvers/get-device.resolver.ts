import { Logger } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { CurrentAuthInfo } from '../../decorators/current-auth-info.decorator';
import { AuthInfo } from '../../types/auth-info.interface';
import { GetDeviceDto } from '../dto/get-device.dto';
import { DeviceLoginHistoriesEntity } from '../entities/device-login-histories.entity';
import { GetDeviceService } from '../services/get-device.service';

@Resolver()
export class GetDeviceResolver {
  private readonly logger = new Logger(GetDeviceResolver.name);

  constructor(private readonly getDeviceService: GetDeviceService) {}

  @Query(() => DeviceLoginHistoriesEntity)
  async getDevice(
    @Args('getDeviceDto') getDeviceDto: GetDeviceDto,
    @CurrentAuthInfo() { authUser }: AuthInfo,
  ): Promise<DeviceLoginHistoriesEntity> {
    this.logger.log('Get Device Start');

    const result = await this.getDeviceService.getDevice(
      authUser,
      getDeviceDto,
    );

    this.logger.log('Get Device End');

    return result;
  }
}
