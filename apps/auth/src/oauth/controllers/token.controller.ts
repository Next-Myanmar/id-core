import {
  CurrentOrigin,
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
  UseGuards,
} from '@nestjs/common';
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
    @CurrentUserAgent() userAgentDetails: UserAgentDetails,
    @CurrentOrigin() origin: string | null,
    @Body() generateTokenPairDto: TokenDto,
  ): Promise<TokenPairResponse> {
    this.logger.log('Token Start');

    const result = await this.tokenService.token(
      userAgentDetails,
      origin,
      generateTokenPairDto,
    );

    this.logger.log('Token End');

    return result;
  }
}
