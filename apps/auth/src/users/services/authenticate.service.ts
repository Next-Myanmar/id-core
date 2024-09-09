import { getUserAgentDetails } from '@app/common';
import { Injectable, Logger } from '@nestjs/common';
import { getTokenFromAuthorization } from '../../utils/utils';
import { AuthenticateDto } from '../dto/authenticate.dto';
import { TokenInfo } from '../types/token-info.interface';
import { TokenService } from './token.service';

@Injectable()
export class AuthenticateService {
  private readonly logger = new Logger(AuthenticateService.name);

  constructor(private readonly tokenService: TokenService) {}

  async authenticate(authenticateDto: AuthenticateDto): Promise<TokenInfo> {
    this.logger.debug(`AuthenticateDto: ${JSON.stringify(authenticateDto)}`);

    const accessToken = getTokenFromAuthorization(
      authenticateDto.authorization,
    );
    this.logger.debug(`AccessToken: ${accessToken}`);

    const userAgentDetails = getUserAgentDetails(
      authenticateDto.userAgentSource,
    );
    this.logger.debug(`UserAgentDetails: ${JSON.stringify(userAgentDetails)}`);

    const tokenInfo = await this.tokenService.authenticate(
      accessToken,
      userAgentDetails.userAgentId,
    );

    return tokenInfo;
  }
}
