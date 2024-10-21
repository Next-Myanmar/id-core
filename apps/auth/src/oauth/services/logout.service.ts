import { Injectable, Logger } from '@nestjs/common';
import { AuthType } from '../../enums/auth-type.enum';
import { TokenGeneratorService } from '../../services/token-generator.service';
import { TokenInfo } from '../../types/token-info.interface';

@Injectable()
export class LogoutService {
  private readonly logger = new Logger(LogoutService.name);

  constructor(private readonly tokenService: TokenGeneratorService) {}

  async logout({ client, authInfo }: TokenInfo) {
    await this.tokenService.transaction(async () => {
      await this.tokenService.revokeKeysInfo(AuthType.Oauth, client, authInfo);
    });
  }
}
