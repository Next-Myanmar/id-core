import {
  CurrentUserAgent,
  TokenPairResponseDto,
  UrlEncodedGuard,
  UserAgentDetails,
} from '@app/common';
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
import { Request } from 'express';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { RefreshTokenService } from '../services/refresh-token.service';

@Controller('api')
export class RefreshTokenController {
  private readonly logger = new Logger(
    `Users (API) - ${RefreshTokenController.name}`,
  );

  constructor(private readonly refreshTokenService: RefreshTokenService) {}

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @UseGuards(UrlEncodedGuard)
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
    @CurrentUserAgent() userAgentDetails: UserAgentDetails,
    @Req() req: Request,
  ): Promise<TokenPairResponseDto> {
    this.logger.log('Refresh Token Start');

    const result = await this.refreshTokenService.refreshToken(
      req,
      refreshTokenDto,
      userAgentDetails,
    );

    this.logger.log('Refresh Token End');

    return {
      accessToken: result.accessToken,
      expiresIn: result.accessTokenLifetime,
      refreshToken: result.refreshToken,
    };
  }
}
