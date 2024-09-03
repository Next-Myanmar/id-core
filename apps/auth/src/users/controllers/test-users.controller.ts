import { getUserAgentDetails } from '@app/common';
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { LogoutService } from '../services/logout.service';

@Controller('api/users/test')
export class TestUsersController {
  private readonly logger = new Logger(
    `Users (Test API) - ${TestUsersController.name}`,
  );

  constructor(private readonly logoutService: LogoutService) {}

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request, @Body() { userAgent }: any): Promise<void> {
    this.logger.log('Test Logout Start');

    const userAgentDetails = getUserAgentDetails(userAgent);

    await this.logoutService.logout(req, userAgentDetails);

    this.logger.log('Test Logout End');
  }
}
