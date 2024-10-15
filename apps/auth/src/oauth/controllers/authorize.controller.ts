import { Public } from '@app/common';
import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Query,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthorizeDto } from '../dto/authorize.dto';
import { AuthorizeService } from '../services/authorize/authorize.service';
import { AuthorizeResponse } from '../types/authorize.response.interface';

@Controller('api/oauth')
export class AuthorizeController {
  private readonly logger = new Logger(
    `Oauth (API) - ${AuthorizeController.name}`,
  );

  constructor(private readonly authorizeService: AuthorizeService) {}

  @Get('authorize')
  @HttpCode(HttpStatus.OK)
  @Public()
  async authorize(
    @Req() req: Request,
    @Query() authorizeDto: AuthorizeDto,
  ): Promise<AuthorizeResponse> {
    this.logger.log('Authorize Start');

    const result = await this.authorizeService.authorize(req, authorizeDto);

    this.logger.log('Authorize End');

    return result;
  }
}
