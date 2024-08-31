import {
  compareHash,
  hash,
  I18nValidationException,
  i18nValidationMessage,
  RedisService,
} from '@app/common';
import { TokenType } from '@app/common/grpc/auth-users';
import {
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VERIFICATION_REDIS_PROVIDER } from '../../redis/verification-redis.module';
import { RefreshTokenLifetimeKeys } from '../constants/constants';
import { VerificationInfo } from './verification-info.interface';

@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);

  constructor(
    private readonly config: ConfigService,
    @Inject(VERIFICATION_REDIS_PROVIDER)
    private readonly verificationRedis: RedisService,
  ) {}

  getVerificationKey(userId: string, deviceId: string): string {
    return `verification-${userId}-${deviceId}`;
  }

  private async generateVerificationCode(): Promise<{
    verificationCode: number;
    hashedVerificationCode: string;
  }> {
    const verificationCode = Math.floor(100000 + Math.random() * 900000);

    const hashedVerificationCode = await hash(verificationCode.toString());

    return { verificationCode, hashedVerificationCode };
  }

  async createVerificationCode(
    userId: string,
    deviceId: string,
    tokenType: TokenType,
  ): Promise<number> {
    this.logger.debug('createVerificationCode Start');

    const { verificationCode, hashedVerificationCode } =
      await this.generateVerificationCode();

    const key = this.getVerificationKey(userId, deviceId);

    const verificationInfo: VerificationInfo = {
      code: hashedVerificationCode,
      retryCount: 0,
      resendCodeCount: 0,
    };

    const lifetimeKey = RefreshTokenLifetimeKeys[tokenType];

    const lifetime = Number(this.config.getOrThrow<number>(lifetimeKey));

    this.verificationRedis.setWithExpire(
      key,
      JSON.stringify(verificationInfo),
      lifetime,
    );

    this.logger.debug(`Verification Code: ${verificationCode}`);

    this.logger.debug('createVerificationCode End');

    return verificationCode;
  }

  async checkVerificationCode(
    userId: string,
    deviceId: string,
    verificationCode: number,
  ): Promise<string> {
    this.logger.debug('checkVerificationCode Start');

    const key = this.getVerificationKey(userId, deviceId);

    const value = await this.verificationRedis.get(key);

    if (!value) {
      this.logger.debug('The verification code is expired');

      this.throwInvalidVerificationCodeValidationError();
    }

    const verificationInfo: VerificationInfo = JSON.parse(value);

    const isEqual = await compareHash(
      verificationCode.toString(),
      verificationInfo.code,
    );

    if (!isEqual) {
      const allowCodeAttempts = Number(
        this.config.getOrThrow<number>('ALLOW_CODE_ATTEMPTS'),
      );
      verificationInfo.retryCount = verificationInfo.retryCount + 1;

      this.logger.debug(`Allow Code Attempts: ${allowCodeAttempts}`);

      if (verificationInfo.retryCount < allowCodeAttempts) {
        await this.verificationRedis.update(
          key,
          JSON.stringify(verificationInfo),
        );
      }

      this.logger.debug(`Retry Count: ${verificationInfo.retryCount}`);

      this.throwInvalidVerificationCodeValidationError();
    }

    this.logger.debug('checkVerificationCode End');

    return key;
  }

  async checkResendCodeAvailable(
    userId: string,
    deviceId: string,
  ): Promise<{ isAvailable: boolean; code: number }> {
    this.logger.debug('checkResendCodeAvailable Start');

    const key = this.getVerificationKey(userId, deviceId);

    const value = await this.verificationRedis.get(key);

    if (!value) {
      this.logger.debug('The verification code is expired');
      throw new UnauthorizedException();
    }

    const verificationInfo: VerificationInfo = JSON.parse(value);

    verificationInfo.resendCodeCount = verificationInfo.resendCodeCount + 1;
    this.logger.debug(
      `Resend Code Attempts: ${verificationInfo.resendCodeCount}`,
    );

    const allowResendCodeAttempts = Number(
      this.config.getOrThrow<number>('ALLOW_RESEND_CODE_ATTEMPTS'),
    );
    this.logger.debug(`Allow Resend Code Attempts: ${allowResendCodeAttempts}`);

    const isAvailable =
      verificationInfo.resendCodeCount < allowResendCodeAttempts;

    let code: number;
    if (isAvailable) {
      const { verificationCode, hashedVerificationCode } =
        await this.generateVerificationCode();

      verificationInfo.code = hashedVerificationCode;
      verificationInfo.retryCount = 0;

      this.logger.debug(
        `Updated Verification Code Info: ${JSON.stringify(verificationInfo)}`,
      );

      await this.verificationRedis.update(
        key,
        JSON.stringify(verificationInfo),
      );

      code = verificationCode;
    }

    this.logger.debug('checkResendCodeAvailable End');

    return { isAvailable, code };
  }

  private throwInvalidVerificationCodeValidationError(): never {
    throw I18nValidationException.create({
      property: 'code',
      message: i18nValidationMessage({
        message: 'validation.INVALID_CODE',
      }),
    });
  }
}
