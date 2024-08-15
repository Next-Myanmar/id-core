import { CurrentUserAgent, TokenPairResponseDto } from '@app/common';
import { Body, Controller, Logger, Post } from '@nestjs/common';
import { UserAgentDetails } from '../../../../../libs/common/src/utils/user-agent-utils';
import { SignupDto } from '../dto/signup.dto';
import { SignupService } from '../services/signup.service';

@Controller('api')
export class SignupController {
  private readonly logger = new Logger(SignupController.name);

  constructor(private readonly signupService: SignupService) {}

  @Post('signup')
  async signup(
    @Body() signupDto: SignupDto,
    @CurrentUserAgent() userAgentDetails: UserAgentDetails,
  ): Promise<TokenPairResponseDto> {
    this.logger.log('Signup Start');

    const result = await this.signupService.signup(signupDto, userAgentDetails);

    this.logger.log('Signup End');

    return result;
  }
}
