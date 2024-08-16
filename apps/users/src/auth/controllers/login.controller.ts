import {
  CurrentUserAgent,
  Public,
  TokenPairResponseDto,
  UserAgentDetails,
} from '@app/common';
import { Body, Controller, Logger, Post } from '@nestjs/common';
import { LoginDto } from '../dto/login.dto';
import { LoginService } from '../services/login.service';

@Controller('api')
export class LoginController {
  private readonly logger = new Logger(LoginController.name);

  constructor(private readonly loginService: LoginService) {}

  @Post('login')
  @Public()
  async login(
    @Body() loginDto: LoginDto,
    @CurrentUserAgent() userAgentDetails: UserAgentDetails,
  ): Promise<TokenPairResponseDto> {
    this.logger.log('Login Start');

    const result = await this.loginService.login(loginDto, userAgentDetails);

    this.logger.log('Login End');

    return result;
  }
}
