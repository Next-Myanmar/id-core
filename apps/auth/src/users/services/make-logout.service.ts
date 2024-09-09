import { Injectable, Logger } from '@nestjs/common';
import { GeneratedTokenDto } from '../dto/generated-token.dto';
import { TokenService } from './token.service';

@Injectable()
export class MakeLogoutService {
  private readonly logger = new Logger(MakeLogoutService.name);

  constructor(private readonly tokenService: TokenService) {}

  async makeLogout(generatedTokens: GeneratedTokenDto[]): Promise<void> {
    await this.tokenService.transaction(async () => {
      for (const generatedToken of generatedTokens) {
        const { key, keysInfo } = await this.tokenService.getKeysInfo(
          generatedToken.userId,
          generatedToken.deviceId,
        );

        if (keysInfo && keysInfo.tokenType === generatedToken.tokenType) {
          await this.tokenService.deleteKeysInfo(key, keysInfo);
        }
      }
    });
  }
}
