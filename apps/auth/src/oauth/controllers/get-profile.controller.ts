import { Profile } from '@app/grpc/users-oauth';
import { Controller, Get, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { CurrentTokenInfo } from '../../decorators/current-token-info.decorator';
import { TokenInfo } from '../../types/token-info.interface';
import { GetProfileService } from '../services/get-profile.service';

@Controller('api/oauth')
export class GetProfileController {
  private readonly logger = new Logger(
    `Oauth (API) - ${GetProfileController.name}`,
  );

  constructor(private readonly getProfileService: GetProfileService) {}

  @Get('profile')
  @HttpCode(HttpStatus.OK)
  async logout(@CurrentTokenInfo() tokenInfo: TokenInfo): Promise<Profile> {
    this.logger.log('Get Profile Start');

    const result = await this.getProfileService.getProfile(tokenInfo);

    this.logger.log('Get Profile End');

    return result;
  }
}
