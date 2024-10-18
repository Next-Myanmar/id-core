import { Logger } from '@nestjs/common';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { CreateClientOauthDto } from '../dto/create-client-Oauth.dto';
import { ClientOauthEntity } from '../entities/client-oauth.entity';
import { CreateClientOauthService } from '../services/create-client-oauth.service';

@Resolver()
export class CreateClientOauthResolver {
  private readonly logger = new Logger(CreateClientOauthResolver.name);

  constructor(
    private readonly createClientOauthService: CreateClientOauthService,
  ) {}

  @Mutation(() => ClientOauthEntity)
  async createClientOauth(
    @Args('createClientOauthDto') createClientOauthDto: CreateClientOauthDto,
  ): Promise<ClientOauthEntity> {
    this.logger.log('Create Client Oauth Start');

    const result =
      await this.createClientOauthService.createClientOauth(
        createClientOauthDto,
      );

    this.logger.log('Create Client Oauth End');

    return result;
  }
}
