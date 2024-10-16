import { TokenType } from '@app/grpc/auth-users';
import { Controller, HttpCode, HttpStatus, Logger, Post } from '@nestjs/common';
import { AuthTokenTypes } from '../../decorators/auth-token-type.decorator';
import { CurrentAuthInfo } from '../../decorators/current-auth-info.decorator';
import { AuthInfo } from '../../types/auth-info.interface';
import { ResendCodeService } from '../services/resend-code.service';

@Controller('api')
export class ResendCodeController {
  private readonly logger = new Logger(ResendCodeController.name);

  constructor(private readonly resendCodeService: ResendCodeService) {}

  @Post('resend-code')
  @HttpCode(HttpStatus.OK)
  @AuthTokenTypes(TokenType.ActivateUser, TokenType.VerifyLogin)
  async resendCode(@CurrentAuthInfo() authInfo: AuthInfo): Promise<void> {
    this.logger.log('Resend Code Start');

    await this.resendCodeService.resendCode(authInfo);

    this.logger.log('Resend Code End');
  }
}
