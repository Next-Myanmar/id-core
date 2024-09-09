import { Injectable, Logger } from '@nestjs/common';
import { GenerateTokenPairDto } from '../dto/generate-token-pair.dto';
import { TokenInfo } from '../types/token-info.interface';
import { TokenService } from './token.service';

@Injectable()
export class GenerateTokenPairService {
  private readonly logger = new Logger(GenerateTokenPairService.name);

  constructor(private readonly tokenService: TokenService) {}

  async generateTokenPair(
    generateTokenPairDto: GenerateTokenPairDto,
  ): Promise<TokenInfo> {
    const result = await this.tokenService.transaction(async () => {
      return await this.tokenService.saveTokens(
        generateTokenPairDto.userId,
        generateTokenPairDto.deviceId,
        generateTokenPairDto.userAgentSource,
        generateTokenPairDto.tokenType,
        generateTokenPairDto.accessTokenLifetime,
        generateTokenPairDto.refreshTokenLifetime,
      );
    });

    return result;
  }
}
