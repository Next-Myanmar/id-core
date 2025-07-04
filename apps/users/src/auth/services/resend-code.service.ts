import { emitEmail } from '@app/common';
import { TokenType } from '@app/grpc/auth-users';
import { User } from '@app/prisma/users';
import {
  NOTIFICATIONS_USERS_SERVERS_NAME,
  SEND_ACTIVATE_USER_EMAIL,
  SEND_VERIFY_LOGIN_EMAIL,
  SendActivateUserEmailDto,
  SendVerifyLoginEmailDto,
} from '@app/rmq/notifications-users';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { AuthInfo } from '../../types/auth-info.interface';
import { VerificationService } from './verification.service';

@Injectable()
export class ResendCodeService {
  private readonly logger = new Logger(ResendCodeService.name);

  constructor(
    private readonly verification: VerificationService,
    @Inject(NOTIFICATIONS_USERS_SERVERS_NAME)
    private readonly client: ClientProxy,
  ) {}

  async resendCode({ authUser, user }: AuthInfo): Promise<void> {
    const info = this.infos[authUser.tokenType];

    await this.verification.transaction(async () => {
      const { isAvailable, code } =
        await this.verification.checkResendCodeAvailable(
          user.id,
          authUser.deviceId,
          authUser.tokenType,
        );

      if (isAvailable) {
        const data = info.emailDto(user, code);

        await emitEmail(this.client, info.emailEventName, data);
      }
    });
  }

  private readonly infos = {
    [TokenType.ActivateUser]: {
      emailEventName: SEND_ACTIVATE_USER_EMAIL,
      emailDto: (user: User, code: number) => {
        const data: SendActivateUserEmailDto = {
          recipient: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          code,
        };

        return data;
      },
    },
    [TokenType.VerifyLogin]: {
      emailEventName: SEND_VERIFY_LOGIN_EMAIL,
      emailDto: (user: User, code: number) => {
        const data: SendVerifyLoginEmailDto = {
          recipient: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          code,
        };

        return data;
      },
    },
  };
}
