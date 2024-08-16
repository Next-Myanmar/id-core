import { I18nExceptionFilter, I18nValidationPipe } from '@app/common';
import {
  SEND_WELCOME_USER_EMAIL,
  SendWelcomeUserEmailDto,
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
import { SendWelcomeUserEmailService } from '../services/send-welcome-user-email.service';

@Controller()
export class SendWelcomeUserEmailController {
  private readonly logger = new Logger(
    `Users - ${SendWelcomeUserEmailController.name}`,
  );

  constructor(
    private readonly sendWelcomeUserEmailService: SendWelcomeUserEmailService,
  ) {}

  @EventPattern(SEND_WELCOME_USER_EMAIL)
  @UseInterceptors(I18nLanguageInterceptor)
  @UsePipes(
    new I18nValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )
  @UseFilters(new I18nExceptionFilter())
  async handleSendWelcomeEmail(
    @Payload() sendWelcomeUserEmailDto: SendWelcomeUserEmailDto,
  ): Promise<void> {
    this.logger.log('Send Welcome User Email Start');

    await this.sendWelcomeUserEmailService.sendWelcomeUserEmail(
      sendWelcomeUserEmailDto,
    );

    this.logger.log('Send Welcome User Email End');
  }
}
