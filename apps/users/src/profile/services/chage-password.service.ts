import {
  compareHash,
  I18nValidationException,
  i18nValidationMessage,
} from '@app/common';
import { AuthUser, AuthUsersService, TokenType } from '@app/grpc/auth-users';
import { User, UsersPrismaService } from '@app/prisma/users';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RefreshTokenLifetimeKeys } from '../../auth/constants/constants';
import { updateUserPassword } from '../../utils/utils';
import { ChangePasswordDto } from '../dto/chage-password.dto';

@Injectable()
export class ChangePasswordService {
  private readonly logger = new Logger(ChangePasswordService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: UsersPrismaService,
    private readonly authUsers: AuthUsersService,
  ) {}

  async changePassword(
    authUser: AuthUser,
    user: User,
    changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    await this.checkPassword(user, changePasswordDto);

    await this.prisma.transaction(async (prisma) => {
      await updateUserPassword(
        prisma,
        authUser.userId,
        authUser.deviceId,
        changePasswordDto.newPassword,
      );

      if (changePasswordDto.makeLogout) {
        const refreshLifetimeKey = RefreshTokenLifetimeKeys[TokenType.Normal];

        const refreshTokenLifetime = Number(
          this.config.getOrThrow<number>(refreshLifetimeKey),
        );

        await this.authUsers.makeAllLogout({
          userId: authUser.userId,
          refreshTokenLifetime,
          currentDeviceId: authUser.deviceId,
        });
      }
    });
  }

  private async checkPassword(
    user: User,
    changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    const isCurrentPasswordSame = await compareHash(
      changePasswordDto.currentPassword,
      user.password,
    );

    if (!isCurrentPasswordSame) {
      throw I18nValidationException.create({
        property: 'currentPassword',
        message: i18nValidationMessage({
          property: 'property.CurrentPassword',
          message: 'validation.INCORRECT',
        }),
      });
    }

    if (changePasswordDto.currentPassword === changePasswordDto.newPassword) {
      throw I18nValidationException.create({
        property: 'newPassword',
        message: i18nValidationMessage({
          message: 'validation.INVALID_NEW_PASSWORD',
        }),
      });
    }
  }
}
