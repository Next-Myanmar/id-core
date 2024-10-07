import { Injectable, Logger } from '@nestjs/common';
import { TokenService } from '../../services/token.service';
import { AuthTokenInfo } from '../../types/auth-token-info.interface';

@Injectable()
export class LogoutService {
  private readonly logger = new Logger(LogoutService.name);

  constructor(private readonly token: TokenService) {}

  async logout({ client, authInfo }: AuthTokenInfo) {
    await this.token.transaction(async () => {
      await this.token.revokeKeysInfo(client, authInfo);
    });
  }
}
