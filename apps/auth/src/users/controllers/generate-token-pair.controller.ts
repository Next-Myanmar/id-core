import {
  AUTH_USERS_SERVICE_NAME,
  METHOD_GENERATE_TOKEN_PAIR,
  TokenPairResponse,
} from '@app/grpc/auth-users';
import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod, Payload } from '@nestjs/microservices';
import { GenerateTokenPairDto } from '../dto/generate-token-pair.dto';
import { GenerateTokenPairService } from '../services/generate-token-pair.service';

@Controller()
export class GenerateTokenPairController {
  private readonly logger = new Logger(
    `Users (gRpc) - ${GenerateTokenPairController.name}`,
  );

  constructor(
    private readonly generateTokenPairService: GenerateTokenPairService,
  ) {}

  @GrpcMethod(AUTH_USERS_SERVICE_NAME, METHOD_GENERATE_TOKEN_PAIR)
  async generateTokenPair(
    @Payload() generateTokenPairDto: GenerateTokenPairDto,
  ): Promise<TokenPairResponse> {
    this.logger.log('Generate Token Pair Start');

    const result =
      await this.generateTokenPairService.generateTokenPair(
        generateTokenPairDto,
      );

    this.logger.log('Generate Token Pair End');

    return result;
  }
}
