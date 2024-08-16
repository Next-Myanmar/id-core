import { RedisService } from '@app/common';
import { TokenType } from '@app/common/grpc/auth-users';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { VERIFICATION_REDIS_PROVIDER } from '../../redis/verification-redis.module';
import { TokenService } from '../../token/token.service';
import { AuthInfo } from '../../types/auth-info.interface';
import { updateDeviceIsLogined, updateLoginHistory } from '../../utils/utils';
import { VerifyLoginDto } from '../dto/verify-login.dto';
import { VerificationService } from '../verification/verification.service';

@Injectable()
export class VerifyLoginService {
  private readonly logger = new Logger(VerifyLoginService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly verification: VerificationService,
    @Inject(VERIFICATION_REDIS_PROVIDER)
    private readonly verificationRedis: RedisService,
    private readonly token: TokenService,
  ) {}

  async verifyLogin(
    verifyLoginDto: VerifyLoginDto,
    { authUser, device }: AuthInfo,
  ) {
    const key = await this.verification.checkVerificationCode(
      authUser.userId,
      authUser.deviceId,
      verifyLoginDto.code,
    );

    const result = await this.verificationRedis.transaction(async () => {
      return await this.prisma.$transaction(async (prisma) => {
        await this.verificationRedis.delete(key);

        await updateDeviceIsLogined(
          prisma,
          authUser.userId,
          [authUser.deviceId],
          true,
          false,
        );

        await updateLoginHistory(prisma, authUser.deviceId);

        const tokenPair = await this.token.generateTokenPair(
          authUser.userId,
          device.id,
          device.userAgentSource,
          TokenType.Normal,
        );

        return tokenPair;
      });
    });

    return result;
  }
}
