import {
  compareHash,
  emitEmail,
  I18nValidationException,
  i18nValidationMessage,
  UserAgentDetails,
} from '@app/common';
import { AuthUsersService, TokenType } from '@app/grpc/auth-users';
import { User, UsersPrismaService } from '@app/prisma/users';
import {
  NOTIFICATIONS_USERS_SERVERS_NAME,
  SEND_VERIFY_LOGIN_EMAIL,
  SendVerifyLoginEmailDto,
} from '@app/rmq/notifications-users';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import {
  AccessTokenLifetimeKeys,
  RefreshTokenLifetimeKeys,
} from '../constants/constants';
import { LoginDto } from '../dto/login.dto';
import { TokenPairResponse } from '../types/token-pair.response';
import { VerificationService } from './verification.service';

@Injectable()
export class LoginService {
  private readonly logger = new Logger(LoginService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: UsersPrismaService,
    private readonly verification: VerificationService,
    private readonly authUsers: AuthUsersService,
    @Inject(NOTIFICATIONS_USERS_SERVERS_NAME)
    private readonly client: ClientProxy,
  ) {}

  async login(
    loginDto: LoginDto,
    userAgentDetails: UserAgentDetails,
  ): Promise<TokenPairResponse> {
    const user = await this.getUser(loginDto);

    const accessLifetimeKey = AccessTokenLifetimeKeys[TokenType.VerifyLogin];
    const refreshLifetimeKey = RefreshTokenLifetimeKeys[TokenType.VerifyLogin];

    const accessTokenLifetime = Number(
      this.config.getOrThrow<number>(accessLifetimeKey),
    );
    const refreshTokenLifetime = Number(
      this.config.getOrThrow<number>(refreshLifetimeKey),
    );

    const tokenPair = await this.authUsers.generateTokenPair({
      userId: user.id,
      ua: userAgentDetails.ua,
      tokenType: TokenType.VerifyLogin,
      accessTokenLifetime,
      refreshTokenLifetime,
    });

    const result = await this.verification.transaction(async () => {
      const loginCode = await this.verification.createVerificationCode(
        user.id,
        tokenPair.deviceId,
        TokenType.VerifyLogin,
      );

      const data: SendVerifyLoginEmailDto = {
        recipient: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        code: loginCode,
      };

      await emitEmail(this.client, SEND_VERIFY_LOGIN_EMAIL, data);

      return {
        accessToken: tokenPair.accessToken,
        expiresIn: tokenPair.expiresIn,
        tokenType: tokenPair.tokenType,
        refreshToken: tokenPair.refreshToken,
      };
    });

    return result;
  }

  private async getUser(loginDto: LoginDto): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email, verified: true },
    });

    if (!user) {
      this.throwValidationError();
    }

    const isSame = await compareHash(loginDto.password, user.password);

    if (!isSame) {
      this.throwValidationError();
    }

    return user;
  }

  private throwValidationError(): never {
    throw I18nValidationException.create({
      message: i18nValidationMessage({
        message: 'validation.INVALID_EMAIL_CREDENTIAL',
      }),
    });
  }
}
