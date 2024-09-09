import { UserAgentDetails } from '@app/common';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { getTokenFromAuthorization } from '../../utils/utils';
import { TokenService } from './token.service';

@Injectable()
export class LogoutService {
  private readonly logger = new Logger(LogoutService.name);

  constructor(private readonly tokenService: TokenService) {}

  async logout(
    req: Request,
    userAgentDetails: UserAgentDetails,
  ): Promise<void> {
    const authorization = req.headers?.authorization;
    if (!authorization) {
      throw new UnauthorizedException();
    }
    const accessToken = getTokenFromAuthorization(authorization);
    this.logger.debug(`AccessToken: ${accessToken}`);

    const tokenInfo = await this.tokenService.authenticate(
      accessToken,
      userAgentDetails.userAgentId,
    );

    await this.tokenService.transaction(async () => {
      await this.tokenService.revokeKeysInfo(
        tokenInfo.user.userId,
        tokenInfo.user.deviceId,
      );
    });
  }
}
