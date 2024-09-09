import { Logger } from '@nestjs/common';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { CurrentAuthInfo } from '../../decorators/current-auth-info.decorator';
import { AuthInfo } from '../../types/auth-info.interface';
import { MakeLogoutDto } from '../dto/make-logout.dto';
import { MakeLogoutService } from '../services/make-logout.service';

@Resolver()
export class MakeLogoutResolver {
  private readonly logger = new Logger(MakeLogoutResolver.name);

  constructor(private readonly makeLogoutService: MakeLogoutService) {}

  @Mutation(() => Boolean)
  async makeLogout(
    @Args('makeLogoutDto')
    makeLogoutDto: MakeLogoutDto,
    @CurrentAuthInfo() { authUser }: AuthInfo,
  ): Promise<boolean> {
    this.logger.log('Make Logout Start');

    await this.makeLogoutService.makeLogout(makeLogoutDto, authUser);

    this.logger.log('Make Logout End');

    return true;
  }
}
