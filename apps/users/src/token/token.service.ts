import { TokenPairResponseDto } from '@app/common';
import {
  AUTH_USERS_SERVICE_NAME,
  AuthUser,
  AuthUsersServiceClient,
  TokenType,
} from '@app/common/grpc/auth-users';
import { status as gRPCStatus } from '@grpc/grpc-js';
import {
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientGrpc } from '@nestjs/microservices';
import { catchError, lastValueFrom, throwError } from 'rxjs';
import {
  AccessTokenLifetimeKeys,
  RefreshTokenLifetimeKeys,
} from '../auth/constants/constants';

@Injectable()
export class TokenService implements OnModuleInit {
  private readonly logger = new Logger(TokenService.name);

  private authUsersServiceClient: AuthUsersServiceClient;

  constructor(
    private readonly config: ConfigService,
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
    userId: string,
    deviceId: string,
    userAgentSource: string,
    tokenType: TokenType,
  ): Promise<TokenPairResponseDto> {
    const accessLifetimeKey = AccessTokenLifetimeKeys[tokenType];
    const refreshLifetimeKey = RefreshTokenLifetimeKeys[tokenType];

    const accessTokenLifetime = Number(
      this.config.getOrThrow<number>(accessLifetimeKey),
    );
    const refreshTokenLifetime = Number(
      this.config.getOrThrow<number>(refreshLifetimeKey),
    );

    const result = this.authUsersServiceClient.generateTokenPair({
      userId,
      deviceId,
      userAgentSource,
      accessTokenLifetime,
      refreshTokenLifetime,
      tokenType,
    });

    const tokens = await lastValueFrom(result);

    this.logger.debug(`Token Type: ${tokenType}`);
    this.logger.debug(`Tokens: ${JSON.stringify(tokens)}`);

    return { ...tokens, expiresIn: accessTokenLifetime };
  }

  async authenticate(
    authorization: string,
    userAgentSource: string,
  ): Promise<AuthUser> {
    const result = this.authUsersServiceClient
      .authenticate({
        authorization,
        userAgentSource,
      })
      .pipe(
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
}
