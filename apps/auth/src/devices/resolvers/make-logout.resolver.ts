import { Logger } from '@nestjs/common';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { CurrentAuthTokenInfo } from '../../decorators/current-auth-token-info.decorator';
import { AuthTokenInfo } from '../../types/auth-token-info.interface';
import { MakeLogoutDto } from '../dto/make-logout.dto';
import { MakeLogoutService } from '../services/make-logout.service';

@Resolver()
export class MakeLogoutResolver {
  private readonly logger = new Logger(MakeLogoutResolver.name);

  constructor(private readonly makeLogoutService: MakeLogoutService) {}

  @Mutation(() => Boolean)
  async makeLogout(
    @CurrentAuthTokenInfo() authTokenInfo: AuthTokenInfo,
    @Args('makeLogoutDto')
    makeLogoutDto: MakeLogoutDto,
  ): Promise<boolean> {
    this.logger.log('Make Logout Start');

    await this.makeLogoutService.makeLogout(authTokenInfo, makeLogoutDto);

    this.logger.log('Make Logout End');

    return true;
  }
}
