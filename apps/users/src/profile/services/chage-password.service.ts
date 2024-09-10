import {
  compareHash,
  I18nValidationException,
  i18nValidationMessage,
} from '@app/common';
import {
  AuthUser,
  GeneratedToken,
  TokenType,
} from '@app/common/grpc/auth-users';
import { Injectable, Logger } from '@nestjs/common';
import { User } from '../../prisma/generated';
import { PrismaService } from '../../prisma/prisma.service';
import { TokenService } from '../../token/token.service';
import { updateUserPassword } from '../../utils/utils';
import { ChangePasswordDto } from '../dto/chage-password.dto';

@Injectable()
export class ChangePasswordService {
  private readonly logger = new Logger(ChangePasswordService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly token: TokenService,
  ) {}

  async changePassword(
    authUser: AuthUser,
    user: User,
    changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    await this.checkPassword(user, changePasswordDto);

    let generatedTokens: GeneratedToken[];

    if (changePasswordDto.makeLogout) {
      const devices = await this.prisma.device.findMany({
        where: { userId: authUser.userId, id: { not: authUser.deviceId } },
      });

      const temp = devices.map((device) => ({
        userId: device.userId,
        deviceId: device.id,
        tokenType: TokenType.Normal,
      }));

      if (temp.length > 0) {
        generatedTokens = temp;
      }
    }

    await this.prisma.transaction(async (prisma) => {
      await updateUserPassword(
        prisma,
        authUser.userId,
        authUser.deviceId,
        changePasswordDto.newPassword,
      );

      if (generatedTokens) {
        await this.token.makeLogout(generatedTokens);
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
