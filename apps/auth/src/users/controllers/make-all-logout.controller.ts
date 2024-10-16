import {
  AUTH_USERS_SERVICE_NAME,
  METHOD_MAKE_ALL_LOGOUT,
} from '@app/grpc/auth-users';
import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod, Payload } from '@nestjs/microservices';
import { MakeAllLogoutDto } from '../dto/male-all-logout.dto';
import { MakeAllLogoutService } from '../services/make-all-logout.service';

@Controller()
export class MakeAllLogoutController {
  private readonly logger = new Logger(
    `Users (gRpc) - ${MakeAllLogoutController.name}`,
  );

  constructor(private readonly makeAllLogoutService: MakeAllLogoutService) {}

  @GrpcMethod(AUTH_USERS_SERVICE_NAME, METHOD_MAKE_ALL_LOGOUT)
  async generateTokenPair(
    @Payload() makeAllLogoutDto: MakeAllLogoutDto,
  ): Promise<void> {
    this.logger.log('Make All Logout Start');

    await this.makeAllLogoutService.makeAllLogout(makeAllLogoutDto);

    this.logger.log('Make All Logout End');
  }
}
