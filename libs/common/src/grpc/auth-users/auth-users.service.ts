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
  AUTH_USERS_SERVICE_NAME,
  AuthenticateRequest,
  AuthUser,
  AuthUsersServiceClient,
  GenerateTokenPairRequest,
  MakeAllLogoutRequest,
  TokenPairResponse,
} from './auth-users';

@Injectable()
export class AuthUsersService implements OnModuleInit {
  private readonly logger = new Logger(AuthUsersService.name);

  private authUsersServiceClient: AuthUsersServiceClient;

  constructor(
    @Inject(AUTH_USERS_SERVICE_NAME)
    private readonly clientGrpc: ClientGrpc,
  ) {}

  onModuleInit() {
    this.authUsersServiceClient =
      this.clientGrpc.getService<AuthUsersServiceClient>(
        AUTH_USERS_SERVICE_NAME,
      );
  }

  async generateTokenPair(
    request: GenerateTokenPairRequest,
  ): Promise<TokenPairResponse> {
    const result = this.authUsersServiceClient.generateTokenPair(request);

    const tokens = await lastValueFrom(result);

    this.logger.debug(`Tokens: ${JSON.stringify(tokens)}`);

    return tokens;
  }

  async authenticate(request: AuthenticateRequest): Promise<AuthUser> {
    const result = this.authUsersServiceClient.authenticate(request).pipe(
      catchError((err) => {
        if (err.code === gRPCStatus.UNAUTHENTICATED) {
          return throwError(() => new UnauthorizedException());
        }
        return throwError(() => err);
      }),
    );

    const authUser = await lastValueFrom(result);

    this.logger.debug(`Auth User: ${JSON.stringify(authUser)}`);

    return authUser;
  }

  async makeAllLogout(request: MakeAllLogoutRequest): Promise<void> {
    const result = this.authUsersServiceClient.makeAllLogout(request);

    await lastValueFrom(result);
  }
}
