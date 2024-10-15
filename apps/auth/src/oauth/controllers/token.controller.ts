import {
  CurrentUserAgent,
  Public,
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
import { TokenDto } from '../dto/token.dto';
import { TokenService } from '../services/token/token.service';
import { TokenPairResponse } from '../types/token-pair-response.interface';

@Controller('api/oauth')
export class TokenController {
  private readonly logger = new Logger(`Oauth (API) - ${TokenController.name}`);

  constructor(private readonly tokenService: TokenService) {}

  @Post('token')
  @HttpCode(HttpStatus.OK)
  @UseGuards(UrlEncodedGuard)
  @Public()
  async generateTokenPair(
    @Req() req: Request,
    @CurrentUserAgent() userAgentDetails: UserAgentDetails,
    @Body() generateTokenPairDto: TokenDto,
  ): Promise<TokenPairResponse> {
    this.logger.log('Token Start');

    const result = await this.tokenService.token(
      req,
      userAgentDetails,
      generateTokenPairDto,
    );

    this.logger.log('Token End');

    return result;
  }
}
