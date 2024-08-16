import { getUserAgentDetails } from '@app/common';
import { Injectable, Logger } from '@nestjs/common';
import { TokenService } from '../../token/token.service';
import { AccessTokenInfo } from '../../types/access-token-info.interface';
import { getTokenFromAuthorization } from '../../utils/utils';
import { AuthenticateDto } from '../dto/authenticate.dto';

@Injectable()
export class AuthenticateService {
  private readonly logger = new Logger(AuthenticateService.name);

  constructor(private readonly tokenService: TokenService) {}

  async authenticate(
    authenticateDto: AuthenticateDto,
  ): Promise<AccessTokenInfo> {
    this.logger.debug(`AuthenticateDto: ${JSON.stringify(authenticateDto)}`);

    const accessToken = getTokenFromAuthorization(
      authenticateDto.authorization,
    );
    this.logger.debug(`AccessToken: ${accessToken}`);

    const userAgentDetails = getUserAgentDetails(
      authenticateDto.userAgentSource,
    );
    this.logger.debug(`UserAgentDetails: ${JSON.stringify(userAgentDetails)}`);

    const tokenInfo = await this.tokenService.authenticateUsers(
      accessToken,
      userAgentDetails.userAgentId,
    );

    return tokenInfo;
  }
}
