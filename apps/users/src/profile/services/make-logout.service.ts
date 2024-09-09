import { I18nValidationException, i18nValidationMessage } from '@app/common';
import { AuthUser, TokenType } from '@app/common/grpc/auth-users';
import { Injectable, Logger } from '@nestjs/common';
import { Device } from '../../prisma/generated';
import { PrismaService } from '../../prisma/prisma.service';
import { TokenService } from '../../token/token.service';
import { MakeLogoutDto } from '../dto/make-logout.dto';

@Injectable()
export class MakeLogoutService {
  private readonly logger = new Logger(MakeLogoutService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly token: TokenService,
  ) {}

  async makeLogout(
    makeLogoutDto: MakeLogoutDto,
    authUser: AuthUser,
  ): Promise<void> {
    const devices = await this.checkDevices(makeLogoutDto, authUser);

    const generatedTokens = devices.map((device) => ({
      userId: device.userId,
      deviceId: device.id,
      tokenType: TokenType.Normal,
    }));

    await this.token.makeLogout(generatedTokens);
  }

  private async checkDevices(
    makeLogoutDto: MakeLogoutDto,
    authUser: AuthUser,
  ): Promise<Device[]> {
    const isCurrentDeviceExist = makeLogoutDto.deviceIds.some(
      (deviceId) => deviceId === authUser.deviceId,
    );

    if (isCurrentDeviceExist) {
      this.logger.warn('The current device exist in make logout.');
      this.throwValidationError();
    }

    const devices = await this.prisma.device.findMany({
      where: { userId: authUser.userId, id: { in: makeLogoutDto.deviceIds } },
    });

    if (devices.length !== makeLogoutDto.deviceIds.length) {
      this.logger.warn('There are invalid devices to make logout.');
      this.throwValidationError();
    }

    return devices;
  }

  private throwValidationError(): never {
    throw I18nValidationException.create({
      message: i18nValidationMessage({ message: 'validation.INVALID_DEVICES' }),
    });
  }
}
