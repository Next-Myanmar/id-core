import { Logger } from '@nestjs/common';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { CurrentTokenInfo } from '../../decorators/current-token-info.decorator';
import { MakeLogoutDto } from '../dto/make-logout.dto';
import { MakeLogoutService } from '../services/make-logout.service';
import { TokenInfo } from '../../types/token-info.interface';

@Resolver()
export class MakeLogoutResolver {
  private readonly logger = new Logger(MakeLogoutResolver.name);

  constructor(private readonly makeLogoutService: MakeLogoutService) {}

  @Mutation(() => Boolean)
  async makeLogout(
    @CurrentTokenInfo() tokenInfo: TokenInfo,
    @Args('makeLogoutDto')
    makeLogoutDto: MakeLogoutDto,
  ): Promise<boolean> {
    this.logger.log('Make Logout Start');

    await this.makeLogoutService.makeLogout(tokenInfo, makeLogoutDto);

    this.logger.log('Make Logout End');

    return true;
  }
}
