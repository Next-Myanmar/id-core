import { UserAgentDetails } from '@app/common';
import { AuthUsersService, TokenType } from '@app/grpc/auth-users';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthInfo } from '../../types/auth-info.interface';
import {
  AccessTokenLifetimeKeys,
  RefreshTokenLifetimeKeys,
} from '../constants/constants';
import { VerifyLoginDto } from '../dto/verify-login.dto';
import { TokenPairResponse } from '../types/token-pair.response';
import { VerificationService } from './verification.service';

@Injectable()
export class VerifyLoginService {
  private readonly logger = new Logger(VerifyLoginService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly verification: VerificationService,
    private readonly authUsers: AuthUsersService,
  ) {}

  async verifyLogin(
    verifyLoginDto: VerifyLoginDto,
    { authUser }: AuthInfo,
    userAgentDetails: UserAgentDetails,
  ): Promise<TokenPairResponse> {
    const key = await this.verification.checkVerificationCode(
      authUser.userId,
      authUser.deviceId,
      TokenType.VerifyLogin,
      verifyLoginDto.code,
    );

    const result = await this.verification.transaction(async () => {
      await this.verification.delete(key);

      const accessLifetimeKey = AccessTokenLifetimeKeys[TokenType.Normal];
      const refreshLifetimeKey = RefreshTokenLifetimeKeys[TokenType.Normal];

      const accessTokenLifetime = Number(
        this.config.getOrThrow<number>(accessLifetimeKey),
      );
      const refreshTokenLifetime = Number(
        this.config.getOrThrow<number>(refreshLifetimeKey),
      );

      const tokenPair = await this.authUsers.generateTokenPair({
        userId: authUser.userId,
        deviceId: authUser.deviceId,
        ua: userAgentDetails.ua,
        tokenType: TokenType.Normal,
        accessTokenLifetime,
        refreshTokenLifetime,
      });

      return {
        accessToken: tokenPair.accessToken,
        expiresIn: tokenPair.expiresIn,
        tokenType: tokenPair.tokenType,
        refreshToken: tokenPair.refreshToken,
      };
    });

    return result;
  }
}
