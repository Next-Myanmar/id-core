import { Logger } from '@nestjs/common';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { CurrentAuthInfo } from '../../decorators/current-auth-info.decorator';
import { AuthInfo } from '../../types/auth-info.interface';
import { ChangePasswordDto } from '../dto/chage-password.dto';
import { ChangePasswordService } from '../services/chage-password.service';

@Resolver()
export class ChangePasswordResolver {
  private readonly logger = new Logger(ChangePasswordResolver.name);

  constructor(private readonly changePasswordService: ChangePasswordService) {}

  @Mutation(() => Boolean)
  async chagePassword(
    @Args('changePasswordDto') changePasswordDto: ChangePasswordDto,
    @CurrentAuthInfo() { authUser, user }: AuthInfo,
  ): Promise<boolean> {
    this.logger.log('Change Password Start');

    await this.changePasswordService.changePassword(
      authUser,
      user,
      changePasswordDto,
    );

    this.logger.log('Change Password End');

    return true;
  }
}
