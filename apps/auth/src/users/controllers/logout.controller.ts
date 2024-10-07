import { Controller, HttpCode, HttpStatus, Logger, Post } from '@nestjs/common';
import { CurrentAuthTokenInfo } from '../../decorators/current-auth-token-info.decorator';
import { AuthTokenInfo } from '../../types/auth-token-info.interface';
import { LogoutService } from '../services/logout.service';

@Controller('api/users')
export class LogoutController {
  private readonly logger = new Logger(LogoutController.name);

  constructor(private readonly logoutService: LogoutService) {}

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentAuthTokenInfo() authTokenInfo: AuthTokenInfo,
  ): Promise<void> {
    this.logger.log('Logout Start');

    const result = await this.logoutService.logout(authTokenInfo);

    this.logger.log('Logout End');

    return result;
  }
}
