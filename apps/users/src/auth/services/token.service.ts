import { TokenPairResponseDto } from '@app/common';
import {
  AUTH_USERS_SERVICE_NAME,
  AuthUsersServiceClient,
  TokenType,
} from '@app/common/grpc/auth-users';
import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientGrpc } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import {
  AccessTokenLifetimeKeys,
  RefreshTokenLifetimeKeys,
} from '../constants/constants';

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
    userAgentId: string,
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
      userAgentId,
      accessTokenLifetime,
      refreshTokenLifetime,
      tokenType,
    });

    const tokens = await lastValueFrom(result);

    this.logger.debug(`Token Type: ${tokenType}`);
    this.logger.debug(`Tokens: ${JSON.stringify(tokens)}`);

    return { ...tokens, expiresIn: accessTokenLifetime };
  }
}
