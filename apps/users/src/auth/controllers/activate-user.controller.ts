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
import { ActivateUserDto } from '../dto/activate-user.dto';
import { ActivateUserService } from '../services/activate-user.service';

@Controller('api')
export class ActivateUserController {
  private readonly logger = new Logger(ActivateUserController.name);

  constructor(private readonly activteUserService: ActivateUserService) {}

  @Post('activate-user')
  @HttpCode(HttpStatus.CREATED)
  @AuthTokenTypes(TokenType.ActivateUser)
  async activateUser(
    @Body() activateUserDto: ActivateUserDto,
    @CurrentAuthInfo() authInfo: AuthInfo,
    @CurrentUserAgent() userAgentDetails: UserAgentDetails,
  ): Promise<TokenPairResponse> {
    this.logger.log('Activate User Start');

    const result = await this.activteUserService.activateUser(
      activateUserDto,
      authInfo,
      userAgentDetails,
    );

    this.logger.log('Activate User End');

    return result;
  }
}
