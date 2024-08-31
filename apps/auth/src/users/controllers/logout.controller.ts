import { CurrentUserAgent, UserAgentDetails } from '@app/common';
import {
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { LogoutService } from '../services/logout.service';

@Controller('api')
export class LogoutController {
  private readonly logger = new Logger(
    `Users (API) - ${LogoutController.name}`,
  );

  constructor(private readonly logoutService: LogoutService) {}

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUserAgent() userAgentDetails: UserAgentDetails,
    @Req() req: Request,
  ): Promise<void> {
    this.logger.log('Logout Start');

    await this.logoutService.logout(req, userAgentDetails);

    this.logger.log('Logout End');
  }
}
