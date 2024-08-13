import {
  compareHash,
  hash,
  I18nValidationException,
  i18nValidationMessage,
  PrismaService,
  RedisService,
  TokenPairResponseDto,
  TransactionalPrismaClient,
  UserAgentDetails,
} from '@app/common';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Device, PasswordHistory, User } from '@prisma/client';
import { SignupDto } from '../dto/signup.dto';
import { VERIFICATION_REDIS_PROVIDER } from '../redis/verification-redis.module';

@Injectable()
export class SignupService {
  private readonly logger = new Logger(SignupService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(VERIFICATION_REDIS_PROVIDER)
    private readonly verificationRedis: RedisService,
  ) {}

  async signup(
    signupDto: SignupDto,
    userAgentDetails: UserAgentDetails,
  ): Promise<TokenPairResponseDto> {
    const existingUser = await this.getExistingUser(signupDto);

    const result = this.verificationRedis.transaction(async () => {
      await this.prisma.$transaction(async (prisma) => {
        const user = await this.upsertUser(prisma, signupDto);

        const device = await this.upsertDevice(prisma, userAgentDetails, user);

        await this.createPasswordHist(
          prisma,
          existingUser,
          user,
          device,
          signupDto,
        );
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
