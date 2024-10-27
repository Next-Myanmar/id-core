import { Profile } from '@app/grpc/users-oauth';
import { Controller, Get, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { CurrentTokenInfo } from '../../decorators/current-token-info.decorator';
import { TokenInfo } from '../../types/token-info.interface';
import { GetUserService } from '../services/get-user.service';

@Controller('api/oauth')
export class GetUserController {
  private readonly logger = new Logger(
    `Oauth (API) - ${GetUserController.name}`,
  );

  constructor(private readonly getUserService: GetUserService) {}

  @Get('user')
  @HttpCode(HttpStatus.OK)
  async logout(@CurrentTokenInfo() tokenInfo: TokenInfo): Promise<Profile> {
    this.logger.log('Get User Start');

    const result = await this.getUserService.getUser(tokenInfo);

    this.logger.log('Get User End');

    return result;
  }
}
