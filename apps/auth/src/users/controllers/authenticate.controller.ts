import {
  AUTH_USERS_SERVICE_NAME,
  AuthUser,
  METHOD_AUTHENTICATE,
} from '@app/grpc/auth-users';
import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod, Payload } from '@nestjs/microservices';
import { AuthenticateDto } from '../dto/authenticate.dto';
import { AuthenticateService } from '../services/authenticate.service';

@Controller()
export class AuthenticateController {
  private readonly logger = new Logger(
    `Users (gRpc) - ${AuthenticateController.name}`,
  );

  constructor(private readonly authenticateService: AuthenticateService) {}

  @GrpcMethod(AUTH_USERS_SERVICE_NAME, METHOD_AUTHENTICATE)
  async generateTokenPair(
    @Payload() authenticateDto: AuthenticateDto,
  ): Promise<AuthUser> {
    this.logger.log('Authenticate Start');

    const result = await this.authenticateService.authenticate(authenticateDto);

    this.logger.log('Authenticate End');

    return result;
  }
}
