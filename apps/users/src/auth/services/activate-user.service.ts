import { emitEmail } from '@app/common';
import {
  AuthUser,
  TokenPairResponse,
  TokenType,
} from '@app/common/grpc/auth-users';
import {
  NOTIFICATIONS_USERS_SERVERS_NAME,
  SEND_WELCOME_USER_EMAIL,
  SendWelcomeUserEmailDto,
} from '@app/common/rmq/notifications/users';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { User } from '../../prisma/generated';
import { PrismaService } from '../../prisma/prisma.service';
import { TransactionalPrismaClient } from '../../prisma/transactional-prisma-client';
import { TokenService } from '../../token/token.service';
import { AuthInfo } from '../../types/auth-info.interface';
import { updateLoginHistory } from '../../utils/utils';
import { ActivateUserDto } from '../dto/activate-user.dto';
import { VerificationService } from './verification.service';

@Injectable()
export class ActivateUserService {
  private readonly logger = new Logger(ActivateUserService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly verification: VerificationService,
    private readonly token: TokenService,
    @Inject(NOTIFICATIONS_USERS_SERVERS_NAME)
    private readonly client: ClientProxy,
  ) {}

  async activateUser(
    activateUserDto: ActivateUserDto,
    { authUser, device }: AuthInfo,
  ): Promise<TokenPairResponse> {
    const key = await this.verification.checkVerificationCode(
      authUser.userId,
      authUser.deviceId,
      activateUserDto.code,
    );

    const result = await this.verification.transaction(async () => {
      return await this.prisma.$transaction(async (prisma) => {
        await this.verification.delete(key);

        const user = await this.updateUserToVerified(prisma, authUser);

        await updateLoginHistory(prisma, authUser.deviceId);

        const tokenPair = await this.token.generateTokenPair(
          user.id,
          device.id,
          device.userAgentSource,
          TokenType.Normal,
        );

        const data: SendWelcomeUserEmailDto = {
          recipient: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        };

        await emitEmail(this.client, SEND_WELCOME_USER_EMAIL, data);

        return tokenPair;
      });
    });

    return result;
  }

  private async updateUserToVerified(
    prisma: TransactionalPrismaClient,
    authUser: AuthUser,
  ): Promise<User> {
    const user = await prisma.user.update({
      where: { id: authUser.userId },
      data: { verified: true, verifiedAt: new Date() },
    });

    return user;
  }
}
