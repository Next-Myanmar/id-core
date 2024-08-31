import { CurrentUserAgent, Public, UserAgentDetails } from '@app/common';
import { TokenPairResponse } from '@app/common/grpc/auth-users';
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
} from '@nestjs/common';
import { SignupDto } from '../dto/signup.dto';
import { SignupService } from '../services/signup.service';

@Controller('api')
export class SignupController {
  private readonly logger = new Logger(SignupController.name);

  constructor(private readonly signupService: SignupService) {}

  @Post('signup')
  @HttpCode(HttpStatus.ACCEPTED)
  @Public()
  async signup(
    @Body() signupDto: SignupDto,
    @CurrentUserAgent() userAgentDetails: UserAgentDetails,
  ): Promise<TokenPairResponse> {
    this.logger.log('Signup Start');

    const result = await this.signupService.signup(signupDto, userAgentDetails);

    this.logger.log('Signup End');

    return result;
  }
}
