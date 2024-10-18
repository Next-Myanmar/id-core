import { Module } from '@nestjs/common';
import { CreateClientOauthResolver } from './resolvers/create-client-oauth.resolver';
import { CreateClientOauthService } from './services/create-client-oauth.service';

@Module({
  imports: [],
  providers: [CreateClientOauthService, CreateClientOauthResolver],
})
export class OauthModule {}
