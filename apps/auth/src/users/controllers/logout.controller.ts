import { Controller, HttpCode, HttpStatus, Logger, Post } from '@nestjs/common';
import { CurrentTokenInfo } from '../../decorators/current-token-info.decorator';
import { LogoutService } from '../services/logout.service';
import { TokenInfo } from '../../types/token-info.interface';

@Controller('api/users')
export class LogoutController {
  private readonly logger = new Logger(
    `Users (API) - ${LogoutController.name}`,
  );

  constructor(private readonly logoutService: LogoutService) {}

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentTokenInfo() tokenInfo: TokenInfo,
  ): Promise<void> {
    this.logger.log('Logout Start');

    const result = await this.logoutService.logout(tokenInfo);

    this.logger.log('Logout End');

    return result;
  }
}
