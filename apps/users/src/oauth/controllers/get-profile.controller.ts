import {
  METHOD_GET_PROFILE,
  Profile,
  USERS_OAUTH_SERVICE_NAME,
} from '@app/grpc/users-oauth';
import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod, Payload } from '@nestjs/microservices';
import { GetProfileDto } from '../dto/get-profile.dto';
import { GetProfileService } from '../services/get-data.service';

@Controller()
export class GetProfileController {
  private readonly logger = new Logger(
    `Oauth (gRpc) - ${GetProfileController.name}`,
  );

  constructor(private readonly getProfileService: GetProfileService) {}

  @GrpcMethod(USERS_OAUTH_SERVICE_NAME, METHOD_GET_PROFILE)
  async getData(@Payload() getProfileDto: GetProfileDto): Promise<Profile> {
    this.logger.log('Get Profile Start');

    const result = await this.getProfileService.getData(getProfileDto);

    this.logger.log('Get Profile End');

    return result;
  }
}
