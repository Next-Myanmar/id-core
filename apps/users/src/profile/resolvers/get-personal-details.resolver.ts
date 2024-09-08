import { Logger } from '@nestjs/common';
import { Query, Resolver } from '@nestjs/graphql';
import { CurrentAuthInfo } from '../../decorators/current-auth-info.decorator';
import { AuthInfo } from '../../types/auth-info.interface';
import { PersonalDetailsEntity } from '../entities/personal-details.entity';
import { GetPersonalDetailsService } from '../services/get-personal-details.service';

@Resolver()
export class GetPersonalDetailsResolver {
  private readonly logger = new Logger(GetPersonalDetailsResolver.name);

  constructor(
    private readonly getPersonalDetailsService: GetPersonalDetailsService,
  ) {}

  @Query(() => PersonalDetailsEntity)
  async getPersonalDetails(
    @CurrentAuthInfo() { user }: AuthInfo,
  ): Promise<PersonalDetailsEntity> {
    this.logger.log('Get Personal Details Start');

    const result =
      await this.getPersonalDetailsService.getPersonalDetails(user);

    this.logger.log('Get Personal Details End');

    return result;
  }
}
