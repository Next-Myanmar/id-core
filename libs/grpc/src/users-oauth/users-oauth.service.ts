import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientGrpc } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import {
  Profile,
  ProfileRequest,
  Scope,
  USERS_OAUTH_SERVICE_NAME,
  UsersOauthServiceClient,
} from './users-oauth';

@Injectable()
export class UsersOauthService implements OnModuleInit {
  private readonly logger = new Logger(UsersOauthService.name);

  private usersOauthServiceClient: UsersOauthServiceClient;

  constructor(
    private readonly config: ConfigService,
    @Inject(USERS_OAUTH_SERVICE_NAME)
    private readonly clientGrpc: ClientGrpc,
  ) {}

  onModuleInit() {
    this.usersOauthServiceClient =
      this.clientGrpc.getService<UsersOauthServiceClient>(
        USERS_OAUTH_SERVICE_NAME,
      );
  }

  async getProfile(request: ProfileRequest): Promise<Profile> {
    const result = this.usersOauthServiceClient.getProfile(request);

    return await lastValueFrom(result);
  }
}
