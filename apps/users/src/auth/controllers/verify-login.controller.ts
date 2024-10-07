import { CurrentUserAgent, UserAgentDetails } from '@app/common';
import { TokenPairResponse, TokenType } from '@app/common/grpc/auth-users';
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
} from '@nestjs/common';
import { AuthTokenTypes } from '../../decorators/auth-token-type.decorator';
import { CurrentAuthInfo } from '../../decorators/current-auth-info.decorator';
import { AuthInfo } from '../../types/auth-info.interface';
import { VerifyLoginDto } from '../dto/verify-login.dto';
import { VerifyLoginService } from '../services/verify-login.service';

@Controller('api')
export class VerifyLoginController {
  private readonly logger = new Logger(VerifyLoginController.name);

  constructor(private readonly verifyLoginService: VerifyLoginService) {}

  @Post('verify-login')
  @HttpCode(HttpStatus.OK)
  @AuthTokenTypes(TokenType.VerifyLogin)
  async verifyLogin(
    @Body() verifyLoginDto: VerifyLoginDto,
    @CurrentAuthInfo() authInfo: AuthInfo,
    @CurrentUserAgent() userAgentDetails: UserAgentDetails,
  ): Promise<TokenPairResponse> {
    this.logger.log('Verify Login Start');

    const result = await this.verifyLoginService.verifyLogin(
      verifyLoginDto,
      authInfo,
      userAgentDetails,
    );

    this.logger.log('Verify Login End');

    return result;
  }
}
