import {
  compareHash,
  emitEmail,
  hash,
  I18nValidationException,
  i18nValidationMessage,
  RedisService,
  TokenPairResponseDto,
  UserAgentDetails,
} from '@app/common';
import { TokenType } from '@app/common/grpc/auth-users';
import {
  NOTIFICATIONS_USERS_SERVERS_NAME,
  SEND_ACTIVATE_USER_EMAIL,
  SendActivateUserEmailDto,
} from '@app/common/rmq/notifications/users';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Device, PasswordHistory, User } from '../../prisma/generated';
import { PrismaService } from '../../prisma/prisma.service';
import { TransactionalPrismaClient } from '../../prisma/transactional-prisma-client';
import { VERIFICATION_REDIS_PROVIDER } from '../../redis/verification-redis.module';
import { TokenService } from '../../token/token.service';
import { SignupDto } from '../dto/signup.dto';
import { VerificationService } from '../verification/verification.service';

@Injectable()
export class SignupService {
  private readonly logger = new Logger(SignupService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(VERIFICATION_REDIS_PROVIDER)
    private readonly verificationRedis: RedisService,
    private readonly verification: VerificationService,
    private readonly token: TokenService,
    @Inject(NOTIFICATIONS_USERS_SERVERS_NAME)
    private readonly client: ClientProxy,
  ) {}

  async signup(
    signupDto: SignupDto,
    userAgentDetails: UserAgentDetails,
  ): Promise<TokenPairResponseDto> {
    const existingUser = await this.getExistingUser(signupDto);

    const result = this.verificationRedis.transaction(async () => {
      return await this.prisma.$transaction(async (prisma) => {
        const user = await this.upsertUser(prisma, signupDto);

        const device = await this.upsertDevice(prisma, userAgentDetails, user);

        await this.createPasswordHist(
          prisma,
          existingUser,
          user,
          device,
          signupDto,
        );

        const activationCode = await this.verification.createVerificationCode(
          user.id,
          device.id,
        );

        const tokenPair = await this.token.generateTokenPair(
          user.id,
          device.id,
          userAgentDetails.userAgentSource,
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
    prisma: TransactionalPrismaClient,
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

  private async upsertDevice(
    prisma: TransactionalPrismaClient,
    userAgentDetails: UserAgentDetails,
    user: User,
  ): Promise<Device> {
    return await prisma.device.upsert({
      where: {
        userId_userAgentId: {
          userId: user.id,
          userAgentId: userAgentDetails.userAgentId,
        },
      },
      update: {
        userAgentSource: userAgentDetails.userAgentSource,
      },
      create: {
        userId: user.id,
        userAgentId: userAgentDetails.userAgentId,
        browser: userAgentDetails.browser,
        os: userAgentDetails.os,
        deviceType: userAgentDetails.deviceType,
        deviceModel: userAgentDetails.deviceModel,
        deviceVendor: userAgentDetails.deviceVendor,
        userAgentSource: userAgentDetails.userAgentSource,
      },
    });
  }

  private async createPasswordHist(
    prisma: TransactionalPrismaClient,
    existingUser: { passwordHistories: PasswordHistory[] } & User,
    user: User,
    device: Device,
    signupDto: SignupDto,
  ): Promise<void> {
    const isAddPasswordHist = !(
      existingUser &&
      ((await compareHash(signupDto.password, existingUser.password)) ||
        existingUser.passwordHistories[0].deviceId == device.id)
    );

    if (isAddPasswordHist) {
      await prisma.passwordHistory.create({
        data: {
          userId: user.id,
          deviceId: device.id,
        },
      });
    }
  }
}
