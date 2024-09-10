import {
  compareHash,
  emitEmail,
  I18nValidationException,
  i18nValidationMessage,
  UserAgentDetails,
} from '@app/common';
import { TokenPairResponse, TokenType } from '@app/common/grpc/auth-users';
import {
  NOTIFICATIONS_USERS_SERVERS_NAME,
  SEND_VERIFY_LOGIN_EMAIL,
  SendVerifyLoginEmailDto,
} from '@app/common/rmq/notifications/users';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Device, User } from '../../prisma/generated';
import { PrismaService } from '../../prisma/prisma.service';
import { TransactionalPrismaClient } from '../../prisma/transactional-prisma-client';
import { TokenService } from '../../token/token.service';
import { LoginDto } from '../dto/login.dto';
import { VerificationService } from './verification.service';

@Injectable()
export class LoginService {
  private readonly logger = new Logger(LoginService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly verification: VerificationService,
    private readonly token: TokenService,
    @Inject(NOTIFICATIONS_USERS_SERVERS_NAME)
    private readonly client: ClientProxy,
  ) {}

  async login(
    loginDto: LoginDto,
    userAgentDetails: UserAgentDetails,
  ): Promise<TokenPairResponse> {
    const user = await this.getUser(loginDto);

    const result = await this.verification.transaction(async () => {
      return await this.prisma.transaction(async (prisma) => {
        const device = await this.upsertDevice(prisma, userAgentDetails, user);

        const loginCode = await this.verification.createVerificationCode(
          user.id,
          device.id,
          TokenType.VerifyLogin,
        );

        const tokenPair = await this.token.generateTokenPair(
          user.id,
          device.id,
          userAgentDetails.userAgentSource,
          TokenType.VerifyLogin,
        );

        const data: SendVerifyLoginEmailDto = {
          recipient: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          code: loginCode,
        };

        await emitEmail(this.client, SEND_VERIFY_LOGIN_EMAIL, data);

        return tokenPair;
      });
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

  private throwValidationError(): never {
    throw I18nValidationException.create({
      message: i18nValidationMessage({
        message: 'validation.INVALID_EMAIL_CREDENTIAL',
      }),
    });
  }
}
