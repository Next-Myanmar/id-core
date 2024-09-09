import {
  AUTH_USERS_SERVICE_NAME,
  METHOD_MAKE_LOGOUT,
} from '@app/common/grpc/auth-users';
import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod, Payload } from '@nestjs/microservices';
import { GeneratedTokensDto } from '../dto/generated-tokens.dto';
import { MakeLogoutService } from '../services/make-logout.service';

@Controller()
export class MakeLogoutController {
  private readonly logger = new Logger(
    `Users (gRpc) - ${MakeLogoutController.name}`,
  );

  constructor(private readonly makeLogoutService: MakeLogoutService) {}

  @GrpcMethod(AUTH_USERS_SERVICE_NAME, METHOD_MAKE_LOGOUT)
  async makeLogout(
    @Payload() generatedTokensDto: GeneratedTokensDto,
  ): Promise<void> {
    this.logger.log('Make Logout Start');

    const result = await this.makeLogoutService.makeLogout(
      generatedTokensDto.generatedTokens,
    );

    this.logger.log('Make Logout End');
  }
}
