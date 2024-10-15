import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientGrpc } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import {
  DataRequest,
  DataResponse,
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

  async getData(request: DataRequest): Promise<DataResponse> {
    const stubMode = this.config.get<boolean>('STUB_MODE', false);

    if (stubMode) {
      const response: DataResponse = {};

      if (request.scopes.includes(Scope.ReadEmail)) {
        response['email'] = 'test@test.com';
      }

      if (request.scopes.includes(Scope.ReadName)) {
        response['firstName'] = 'Test';
        response['lastName'] = 'Test';
      }

      return response;
    }

    const result = this.usersOauthServiceClient.getData(request);

    return await lastValueFrom(result);
  }
}
