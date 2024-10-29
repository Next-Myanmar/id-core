import { emitEmail, UserAgentDetails } from '@app/common';
import { AuthUser, AuthUsersService, TokenType } from '@app/grpc/auth-users';
import {
  User,
  UsersPrismaService,
  UsersTransactionalPrismaClient,
} from '@app/prisma/users';
import {
  NOTIFICATIONS_USERS_SERVERS_NAME,
  SEND_WELCOME_USER_EMAIL,
  SendWelcomeUserEmailDto,
} from '@app/rmq/notifications-users';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import { AuthInfo } from '../../types/auth-info.interface';
import {
  AccessTokenLifetimeKeys,
  RefreshTokenLifetimeKeys,
} from '../constants/constants';
import { ActivateUserDto } from '../dto/activate-user.dto';
import { TokenPairResponse } from '../types/token-pair.response';
import { VerificationService } from './verification.service';

@Injectable()
export class ActivateUserService {
  private readonly logger = new Logger(ActivateUserService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: UsersPrismaService,
    private readonly verification: VerificationService,
    private readonly authUsers: AuthUsersService,
    @Inject(NOTIFICATIONS_USERS_SERVERS_NAME)
    private readonly client: ClientProxy,
  ) {}

  async activateUser(
    activateUserDto: ActivateUserDto,
    { authUser }: AuthInfo,
    userAgentDetails: UserAgentDetails,
  ): Promise<TokenPairResponse> {
    const key = await this.verification.checkVerificationCode(
      authUser.userId,
      authUser.deviceId,
      TokenType.ActivateUser,
      activateUserDto.code,
    );

    const accessLifetimeKey = AccessTokenLifetimeKeys[TokenType.Normal];
    const refreshLifetimeKey = RefreshTokenLifetimeKeys[TokenType.Normal];

    const accessTokenLifetime = Number(
      this.config.getOrThrow<number>(accessLifetimeKey),
    );
    const refreshTokenLifetime = Number(
      this.config.getOrThrow<number>(refreshLifetimeKey),
    );

    const tokenPair = await this.authUsers.generateTokenPair({
      userId: authUser.userId,
      deviceId: authUser.deviceId,
      ua: userAgentDetails.ua,
      tokenType: TokenType.Normal,
      accessTokenLifetime: accessTokenLifetime,
      refreshTokenLifetime: refreshTokenLifetime,
    });

    const result = await this.verification.transaction(async () => {
      return await this.prisma.transaction(async (prisma) => {
        await this.verification.delete(key);

        const user = await this.updateUserToVerified(prisma, authUser);

        const data: SendWelcomeUserEmailDto = {
          recipient: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        };

        await emitEmail(this.client, SEND_WELCOME_USER_EMAIL, data);

        return {
          accessToken: tokenPair.accessToken,
          expiresIn: tokenPair.expiresIn,
          tokenType: tokenPair.tokenType,
          refreshToken: tokenPair.refreshToken,
        };
      });
    });

    return result;
  }

  private async updateUserToVerified(
    prisma: UsersTransactionalPrismaClient,
    authUser: AuthUser,
  ): Promise<User> {
    const user = await prisma.user.update({
      where: { id: authUser.userId },
      data: { verified: true, verifiedAt: new Date() },
    });

    return user;
  }
}
