import {
  AUTH_USERS_SERVICE_NAME,
  GeneratedTokens,
  METHOD_CHECK_AVAILABLE_TOKENS,
} from '@app/common/grpc/auth-users';
import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod, Payload } from '@nestjs/microservices';
import { GeneratedTokensDto } from '../dto/generated-tokens.dto';
import { CheckAvailableTokensService } from '../services/check-available-tokens.service';

@Controller()
export class CheckAvailableTokensController {
  private readonly logger = new Logger(
    `Users (gRpc) - ${CheckAvailableTokensController.name}`,
  );

  constructor(
    private readonly checkAvailableTokensService: CheckAvailableTokensService,
  ) {}

  @GrpcMethod(AUTH_USERS_SERVICE_NAME, METHOD_CHECK_AVAILABLE_TOKENS)
  async checkAvailableTokens(
    @Payload() generatedTokensDto: GeneratedTokensDto,
  ): Promise<GeneratedTokens> {
    this.logger.log('Check Available Tokens Start');

    const result = await this.checkAvailableTokensService.checkAvailableTokens(
      generatedTokensDto.generatedTokens,
    );

    this.logger.log('Check Available Tokens End');

    return { generatedTokens: result };
  }
}
