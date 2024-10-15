import { Injectable, Logger } from '@nestjs/common';
import { AuthType } from '../../enums/auth-type.enum';
import { TokensService } from '../../services/tokens.service';
import { TokenInfo } from '../../types/token-info.interface';

@Injectable()
export class LogoutService {
  private readonly logger = new Logger(LogoutService.name);

  constructor(private readonly token: TokensService) {}

  async logout({ client, authInfo }: TokenInfo) {
    await this.token.transaction(async () => {
      await this.token.revokeKeysInfo(AuthType.Users, client, authInfo);
    });
  }
}
