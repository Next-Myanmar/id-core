import { Public, UrlEncodedGuard } from '@app/common';
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { RevokeTokenDto } from '../dto/revoke-token.dto';
import { IntrospectTokenService } from '../services/introspect-token.service';
import { IntrospectResponse } from '../types/introspect.response';

@Controller('api/oauth/token')
export class IntrospectTokenController {
  private readonly logger = new Logger(
    `Oauth (API) - ${IntrospectTokenController.name}`,
  );

  constructor(
    private readonly introspectTokenService: IntrospectTokenService,
  ) {}

  @Post('introspect')
  @HttpCode(HttpStatus.OK)
  @UseGuards(UrlEncodedGuard)
  @Public()
  async introspect(
    @Body() introspectDto: RevokeTokenDto,
  ): Promise<IntrospectResponse> {
    this.logger.log('Introspect Token Start');

    const result = await this.introspectTokenService.introspect(introspectDto);

    this.logger.log('Introspect Token End');

    return result;
  }
}
