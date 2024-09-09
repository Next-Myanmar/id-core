import { Injectable, Logger } from '@nestjs/common';
import { GeneratedTokenDto } from '../dto/generated-token.dto';
import { TokenService } from './token.service';

@Injectable()
export class CheckAvailableTokensService {
  private readonly logger = new Logger(CheckAvailableTokensService.name);

  constructor(private readonly tokenService: TokenService) {}

  async checkAvailableTokens(
    generatedTokens: GeneratedTokenDto[],
  ): Promise<GeneratedTokenDto[]> {
    this.logger.debug(
      `Requested Available Tokens: ${JSON.stringify(generatedTokens)}`,
    );

    const availableTokens = [];
    for (const generatedToken of generatedTokens) {
      const { keysInfo } = await this.tokenService.getKeysInfo(
        generatedToken.userId,
        generatedToken.deviceId,
      );

      if (keysInfo && keysInfo.tokenType === generatedToken.tokenType) {
        availableTokens.push(generatedToken);
      }
    }

    this.logger.debug(`Available Tokens: ${JSON.stringify(availableTokens)}`);

    return availableTokens;
  }
}
