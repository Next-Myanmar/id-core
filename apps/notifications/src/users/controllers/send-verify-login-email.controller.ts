import { I18nExceptionFilter, I18nValidationPipe } from '@app/common';
import {
  SEND_VERIFY_LOGIN_EMAIL,
  SendVerifyLoginEmailDto,
} from '@app/common/rmq/notifications/users';
import {
  Controller,
  Logger,
  UseFilters,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { I18nLanguageInterceptor } from 'nestjs-i18n';
import { SendVerifyLoginEmailService } from '../services/send-verify-login-email.service';

@Controller()
export class SendVerifyLoginEmailController {
  private readonly logger = new Logger(
    `Users - ${SendVerifyLoginEmailController.name}`,
  );

  constructor(
    private readonly sendVerifyLoginEmailService: SendVerifyLoginEmailService,
  ) {}

  @EventPattern(SEND_VERIFY_LOGIN_EMAIL)
  @UseInterceptors(I18nLanguageInterceptor)
  @UsePipes(
    new I18nValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )
  @UseFilters(new I18nExceptionFilter())
  async handleSendVerifyLoginEmail(
    @Payload() sendVerifyLoginEmailDto: SendVerifyLoginEmailDto,
  ): Promise<void> {
    this.logger.log('Send Verify Login Email Start');

    await this.sendVerifyLoginEmailService.sendVerifyLoginEmail(
      sendVerifyLoginEmailDto,
    );

    this.logger.log('Send Verify Login Email End');
  }
}
