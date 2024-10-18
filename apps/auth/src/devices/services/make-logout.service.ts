import { I18nValidationException, i18nValidationMessage } from '@app/common';
import { AuthPrismaService, Device } from '@app/prisma/auth';
import { Injectable, Logger } from '@nestjs/common';
import { TokenGeneratorService } from '../../services/token-generator.service';
import { AuthOauthInfo } from '../../types/auth-oauth-info.interface';
import { ClientOauth } from '../../types/client-oauth.interface';
import { TokenInfo } from '../../types/token-info.interface';
import { AuthUsersInfo } from '../../types/users-auth-info.interface';
import { MakeLogoutDto } from '../dto/make-logout.dto';

@Injectable()
export class MakeLogoutService {
  private readonly logger = new Logger(MakeLogoutService.name);

  constructor(
    private readonly prisma: AuthPrismaService,
    private readonly token: TokenGeneratorService,
  ) {}

  async makeLogout(
    tokenInfo: TokenInfo,
    makeLogoutDto?: MakeLogoutDto,
  ): Promise<void> {
    let devices = await this.checkDevices(
      tokenInfo.client,
      tokenInfo.authInfo,
      makeLogoutDto,
    );

    const keys = devices.map((device) =>
      this.token.getKeysInfoKey(
        tokenInfo.authType,
        device.clientOauthId,
        device.userId,
        device.id,
      ),
    );

    await this.token.transaction(async () => {
      for (const key of keys) {
        await this.token.revokeKeysInfoByKey(key);
      }
    });
  }

  private async checkDevices(
    client: ClientOauth,
    authInfo: AuthUsersInfo | AuthOauthInfo,
    makeLogoutDto: MakeLogoutDto,
  ): Promise<Device[]> {
    const isCurrentDeviceExist = makeLogoutDto.deviceIds.some(
      (deviceId) => deviceId === authInfo.deviceId,
    );

    if (isCurrentDeviceExist) {
      this.logger.warn('The current device exist in make logout.');
      this.throwValidationError();
    }

    const devices = await this.prisma.device.findMany({
      where: {
        clientOauthId: client.id,
        userId: authInfo.userId,
        id: { in: makeLogoutDto.deviceIds },
      },
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
