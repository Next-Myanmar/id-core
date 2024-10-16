import { I18nExceptionFilter, I18nValidationPipe } from '@app/common';
import {
  SEND_ACTIVATE_USER_EMAIL,
  SendActivateUserEmailDto,
} from '@app/rmq/notifications-users';
import {
  Controller,
  Logger,
  UseFilters,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { I18nLanguageInterceptor } from 'nestjs-i18n';
import { SendActivateUserEmailService } from '../services/send-activate-user-email.service';

@Controller()
export class SendActivateUserEmailController {
  private readonly logger = new Logger(
    `Users - ${SendActivateUserEmailController.name}`,
  );

  constructor(
    private readonly sendActivateUserEmailService: SendActivateUserEmailService,
  ) {}

  @EventPattern(SEND_ACTIVATE_USER_EMAIL)
  @UseInterceptors(I18nLanguageInterceptor)
  @UsePipes(
    new I18nValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )
  @UseFilters(new I18nExceptionFilter())
  async handleSendActivateUserEmail(
    @Payload() sendActivateUserEmailDto: SendActivateUserEmailDto,
  ): Promise<void> {
    this.logger.log('Send Activate User Email Start');

    await this.sendActivateUserEmailService.sendActivateUserEmail(
      sendActivateUserEmailDto,
    );

    this.logger.log('Send Activate User Email End');
  }
}
