import {
  DataResponse,
  METHOD_GET_DATA,
  USERS_OAUTH_SERVICE_NAME,
} from '@app/grpc/users-oauth';
import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod, Payload } from '@nestjs/microservices';
import { GetDataDto } from '../dto/get-data.dto';
import { GetDataService } from '../services/get-data.service';

@Controller()
export class GetDataController {
  private readonly logger = new Logger(
    `Oauth (gRpc) - ${GetDataController.name}`,
  );

  constructor(private readonly getDataService: GetDataService) {}

  @GrpcMethod(USERS_OAUTH_SERVICE_NAME, METHOD_GET_DATA)
  async getData(@Payload() getDataDto: GetDataDto): Promise<DataResponse> {
    this.logger.log('Get Data Start');

    const result = await this.getDataService.getData(getDataDto);

    this.logger.log('Get Data End');

    return result;
  }
}
