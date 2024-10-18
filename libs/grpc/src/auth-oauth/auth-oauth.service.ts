import { status as gRPCStatus } from '@grpc/grpc-js';
import {
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { catchError, lastValueFrom, throwError } from 'rxjs';
import {
  AUTH_OAUTH_SERVICE_NAME,
  AuthenticateRequest,
  AuthOauthServiceClient,
  AuthOauthUser,
} from './auth-oauth';

@Injectable()
export class AuthOauthService implements OnModuleInit {
  private readonly logger = new Logger(AuthOauthService.name);

  private authOauthServiceClient: AuthOauthServiceClient;

  constructor(
    @Inject(AUTH_OAUTH_SERVICE_NAME)
    private readonly clientGrpc: ClientGrpc,
  ) {}

  onModuleInit() {
    this.authOauthServiceClient =
      this.clientGrpc.getService<AuthOauthServiceClient>(
        AUTH_OAUTH_SERVICE_NAME,
      );
  }

  async authenticate(request: AuthenticateRequest): Promise<AuthOauthUser> {
    const result = this.authOauthServiceClient.authenticate(request).pipe(
      catchError((err) => {
        if (err.code === gRPCStatus.UNAUTHENTICATED) {
          return throwError(() => new UnauthorizedException());
        }
        return throwError(() => err);
      }),
    );

    const authUser = await lastValueFrom(result);

    this.logger.debug(`Auth Oauth User: ${JSON.stringify(authUser)}`);

    return authUser;
  }
}
