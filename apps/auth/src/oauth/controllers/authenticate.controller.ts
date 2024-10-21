import {
  AUTH_OAUTH_SERVICE_NAME,
  AuthOauthUser,
  METHOD_AUTHENTICATE,
} from '@app/grpc/auth-oauth';
import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod, Payload } from '@nestjs/microservices';
import { GrpcAuthenticateDto } from '../dto/grpc-authenticate.dto';
import { AuthenticateService } from '../services/authenticate.service';

@Controller()
export class AuthenticateController {
  private readonly logger = new Logger(
    `Oauth (Grpc/API) - ${AuthenticateController.name}`,
  );

  constructor(private readonly authenticateService: AuthenticateService) {}

  @GrpcMethod(AUTH_OAUTH_SERVICE_NAME, METHOD_AUTHENTICATE)
  async grpcAuthenticate(
    @Payload() authenticateDto: GrpcAuthenticateDto,
  ): Promise<AuthOauthUser> {
    this.logger.log('Authenticate (Grpc) Start');

    const result = await this.authenticateService.authenticate(
      authenticateDto.authorization,
    );

    this.logger.log('Authenticate (Grpc) End');

    return result;
  }
}
