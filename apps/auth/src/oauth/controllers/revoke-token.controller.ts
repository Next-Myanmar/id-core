import { CurrentOrigin, Public, UrlEncodedGuard } from '@app/common';
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  UseGuards,
} from '@nestjs/common';
import { RevokeTokenDto } from '../dto/revoke-token.dto';
import { RevokeTokenService } from '../services/revoke-token.service';

@Controller('api/oauth/token')
export class RevokeTokenController {
  private readonly logger = new Logger(
    `Oauth (API) - ${RevokeTokenController.name}`,
  );

  constructor(private readonly revokeTokenService: RevokeTokenService) {}

  @Post('revoke')
  @HttpCode(HttpStatus.OK)
  @UseGuards(UrlEncodedGuard)
  @Public()
  async revoke(
    @Body() revokeDto: RevokeTokenDto,
    @CurrentOrigin() origin: string | null,
  ): Promise<void> {
    this.logger.log('Revoke Token Start');

    await this.revokeTokenService.revoke(revokeDto, origin);

    this.logger.log('Revoke Token End');
  }
}
