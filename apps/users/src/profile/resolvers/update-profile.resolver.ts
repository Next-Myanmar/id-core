import { Logger } from '@nestjs/common';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { CurrentAuthInfo } from '../../decorators/current-auth-info.decorator';
import { AuthInfo } from '../../types/auth-info.interface';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { UserEntity } from '../entities/user.entity';
import { UpdateProfileService } from '../services/update-profile.service';

@Resolver()
export class UpdateProfileResolver {
  private readonly logger = new Logger(UpdateProfileResolver.name);

  constructor(private readonly updateProfileService: UpdateProfileService) {}

  @Mutation(() => UserEntity)
  async updateProfile(
    @Args('updateProfileDto') updateProfileDto: UpdateProfileDto,
    @CurrentAuthInfo() { user }: AuthInfo,
  ): Promise<UserEntity> {
    this.logger.log('Update Profile Start');

    const result = await this.updateProfileService.updateProfile(
      user,
      updateProfileDto,
    );

    this.logger.log('Update Profile End');

    return result;
  }
}
