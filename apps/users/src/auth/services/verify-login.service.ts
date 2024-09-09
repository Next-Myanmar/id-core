import { TokenPairResponse, TokenType } from '@app/common/grpc/auth-users';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TokenService } from '../../token/token.service';
import { AuthInfo } from '../../types/auth-info.interface';
import { updateLoginHistory } from '../../utils/utils';
import { VerifyLoginDto } from '../dto/verify-login.dto';
import { VerificationService } from './verification.service';

@Injectable()
export class VerifyLoginService {
  private readonly logger = new Logger(VerifyLoginService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly verification: VerificationService,
    private readonly token: TokenService,
  ) {}

  async verifyLogin(
    verifyLoginDto: VerifyLoginDto,
    { authUser, device }: AuthInfo,
  ): Promise<TokenPairResponse> {
    const key = await this.verification.checkVerificationCode(
      authUser.userId,
      authUser.deviceId,
      verifyLoginDto.code,
    );

    const result = await this.verification.transaction(async () => {
      return await this.prisma.$transaction(async (prisma) => {
        await this.verification.delete(key);

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
