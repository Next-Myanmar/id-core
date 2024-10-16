import {
  compareHash,
  emitEmail,
  hash,
  I18nValidationException,
  i18nValidationMessage,
  UserAgentDetails,
} from '@app/common';
import {
  AuthUsersService,
  TokenPairResponse,
  TokenType,
} from '@app/grpc/auth-users';
import {
  PasswordHistory,
  User,
  UsersPrismaService,
  UsersTransactionalPrismaClient,
} from '@app/prisma/users';
import {
  NOTIFICATIONS_USERS_SERVERS_NAME,
  SEND_ACTIVATE_USER_EMAIL,
  SendActivateUserEmailDto,
} from '@app/rmq/notifications-users';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import {
  AccessTokenLifetimeKeys,
  RefreshTokenLifetimeKeys,
} from '../constants/constants';
import { SignupDto } from '../dto/signup.dto';
import { VerificationService } from './verification.service';

@Injectable()
export class SignupService {
  private readonly logger = new Logger(SignupService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: UsersPrismaService,
    private readonly verification: VerificationService,
    private readonly authUsers: AuthUsersService,
    @Inject(NOTIFICATIONS_USERS_SERVERS_NAME)
    private readonly client: ClientProxy,
  ) {}

  async signup(
    signupDto: SignupDto,
    userAgentDetails: UserAgentDetails,
  ): Promise<TokenPairResponse> {
    const existingUser = await this.getExistingUser(signupDto);

    const result = await this.verification.transaction(async () => {
      return await this.prisma.transaction(async (prisma) => {
        const user = await this.upsertUser(prisma, signupDto);

        const accessLifetimeKey =
          AccessTokenLifetimeKeys[TokenType.ActivateUser];
        const refreshLifetimeKey =
          RefreshTokenLifetimeKeys[TokenType.ActivateUser];

        const accessTokenLifetime = Number(
          this.config.getOrThrow<number>(accessLifetimeKey),
        );
        const refreshTokenLifetime = Number(
          this.config.getOrThrow<number>(refreshLifetimeKey),
        );

        const tokenPair = await this.authUsers.generateTokenPair({
          userId: user.id,
          ua: userAgentDetails.ua,
          tokenType: TokenType.ActivateUser,
          accessTokenLifetime,
          refreshTokenLifetime,
        });

        await this.createPasswordHist(
          prisma,
          existingUser,
          user,
          tokenPair.deviceId,
          signupDto,
        );

        const activationCode = await this.verification.createVerificationCode(
          user.id,
          tokenPair.deviceId,
          TokenType.ActivateUser,
        );

        const data: SendActivateUserEmailDto = {
          recipient: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          code: activationCode,
        };

        await emitEmail(this.client, SEND_ACTIVATE_USER_EMAIL, data);

        return tokenPair;
      });
    });

    return result;
  }

  private async getExistingUser(
    signupDto: SignupDto,
  ): Promise<{ passwordHistories: PasswordHistory[] } & User> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: signupDto.email },
      include: {
        passwordHistories: {
          orderBy: {
            changedAt: 'desc',
          },
          take: 1,
        },
      },
    });

    if (existingUser?.verified) {
      throw I18nValidationException.create({
        property: 'email',
        message: i18nValidationMessage({ message: 'validation.EMAIL_EXIST' }),
      });
    }

    return existingUser;
  }

  private async upsertUser(
    prisma: UsersTransactionalPrismaClient,
    signupDto: SignupDto,
  ): Promise<User> {
    const hashedPassword = await hash(signupDto.password);

    return await prisma.user.upsert({
      where: { email: signupDto.email },
      update: {
        ...signupDto,
        password: hashedPassword,
        verified: false,
      },
      create: {
        ...signupDto,
        password: hashedPassword,
        verified: false,
      },
    });
  }

  private async createPasswordHist(
    prisma: UsersTransactionalPrismaClient,
    existingUser: { passwordHistories: PasswordHistory[] } & User,
    user: User,
    deviceId: string,
    signupDto: SignupDto,
  ): Promise<void> {
    const isAddPasswordHist = !(
      existingUser &&
      ((await compareHash(signupDto.password, existingUser.password)) ||
        existingUser.passwordHistories[0].deviceId == deviceId)
    );

    if (isAddPasswordHist) {
      await prisma.passwordHistory.create({
        data: {
          userId: user.id,
          deviceId,
        },
      });
    }
  }
}
