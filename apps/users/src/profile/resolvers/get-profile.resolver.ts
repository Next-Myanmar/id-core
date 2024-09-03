import { Logger } from '@nestjs/common';
import { Query, Resolver } from '@nestjs/graphql';
import { CurrentAuthInfo } from '../../decorators/current-auth-info.decorator';
import { AuthInfo } from '../../types/auth-info.interface';
import { UserEntity } from '../entities/user.entity';
import { GetProfileService } from '../services/get-profile.service';

@Resolver()
export class GetProfileResolver {
  private readonly logger = new Logger(GetProfileResolver.name);

  constructor(private readonly getProfileService: GetProfileService) {}

  @Query(() => UserEntity)
  async getProfile(@CurrentAuthInfo() { user }: AuthInfo): Promise<UserEntity> {
    this.logger.log('Get Profile Start');

    const result = await this.getProfileService.getProfile(user);

    this.logger.log('Get Profile End');

    return result;
  }
}
