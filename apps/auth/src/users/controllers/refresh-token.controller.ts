import {
  CurrentUserAgent,
  Public,
  UrlEncodedGuard,
  UserAgentDetails,
} from '@app/common';
import { TokenPairResponse } from '@app/common/grpc/auth-users';
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { RefreshTokenService } from '../services/refresh-token.service';

@Controller('api/users')
export class RefreshTokenController {
  private readonly logger = new Logger(
    `Users (API) - ${RefreshTokenController.name}`,
  );

  constructor(private readonly refreshTokenService: RefreshTokenService) {}

  @Throttle({ short: { limit: 5, ttl: 300 * 1000 } })
  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @UseGuards(UrlEncodedGuard)
  @Public()
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
    @CurrentUserAgent() userAgentDetails: UserAgentDetails,
    @Req() req: Request,
  ): Promise<TokenPairResponse> {
    this.logger.log('Refresh Token Start');

    const result = await this.refreshTokenService.refreshToken(
      req,
      refreshTokenDto,
      userAgentDetails,
    );

    this.logger.log('Refresh Token End');

    return result;
  }
}
