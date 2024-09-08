import { Logger } from '@nestjs/common';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { CurrentAuthInfo } from '../../decorators/current-auth-info.decorator';
import { AuthInfo } from '../../types/auth-info.interface';
import { UpdatePersonalDetailsDto } from '../dto/update-personal-details.dto';
import { PersonalDetailsEntity } from '../entities/personal-details.entity';
import { UpdatePersonalDetailsService } from '../services/update-personal-details.service';

@Resolver()
export class UpdatePersonalDetailsResolver {
  private readonly logger = new Logger(UpdatePersonalDetailsResolver.name);

  constructor(
    private readonly updatePersonalDetailsService: UpdatePersonalDetailsService,
  ) {}

  @Mutation(() => PersonalDetailsEntity)
  async updatePersonalDetails(
    @Args('updatePersonalDetailsDto')
    updatePersonalDetailsDto: UpdatePersonalDetailsDto,
    @CurrentAuthInfo() { user }: AuthInfo,
  ): Promise<PersonalDetailsEntity> {
    this.logger.log('Update Personal Details Start');

    const result =
      await this.updatePersonalDetailsService.updatePersonalDetails(
        user,
        updatePersonalDetailsDto,
      );

    this.logger.log('Update Personal Details End');

    return result;
  }
}
