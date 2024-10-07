import {
  compareHash,
  hash,
  I18nValidationException,
  i18nValidationMessage,
  RedisService,
} from '@app/common';
import { TokenType } from '@app/common/grpc/auth-users';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VERIFICATION_REDIS_PROVIDER } from '../../redis/verification-redis.module';
import { RefreshTokenLifetimeKeys } from '../constants/constants';
import { VerificationInfo } from '../types/verification-info.interface';

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

    this.logger.debug(`Generated verification code: ${verificationCode}`);

    return { verificationCode, hashedVerificationCode };
  }

  async transaction<T>(callback: () => Promise<T>): Promise<T> {
    const result = await this.verificationRedis.transaction(async () => {
      return await callback();
    });

    return result;
  }

  async delete(key: string): Promise<void> {
    await this.verificationRedis.delete(key);
  }

  async createVerificationCode(
    userId: string,
    deviceId: string,
    tokenType: TokenType,
  ): Promise<number> {
    this.logger.debug('createVerificationCode Start');

    const key = this.getVerificationKey(userId, deviceId);
    this.logger.debug(`Verification code key: ${key}`);

    const { verificationCode, hashedVerificationCode } =
      await this.generateVerificationCode();

    const verificationInfo: VerificationInfo = {
      code: hashedVerificationCode,
      retryCount: 0,
      resendCodeCount: 0,
      tokenType,
    };

    const lifetimeKey = RefreshTokenLifetimeKeys[tokenType];

    const lifetime = Number(this.config.getOrThrow<number>(lifetimeKey));

    this.verificationRedis.setWithExpire(
      key,
      JSON.stringify(verificationInfo),
      lifetime,
    );

    this.logger.debug('createVerificationCode End');

    return verificationCode;
  }

  async checkVerificationCode(
    userId: string,
    deviceId: string,
    tokenType: TokenType,
    verificationCode: number,
  ): Promise<string> {
    this.logger.debug('checkVerificationCode Start');

    const key = this.getVerificationKey(userId, deviceId);
    this.logger.debug(`Verification code key: ${key}`);

    const value = await this.verificationRedis.get(key);
    this.logger.debug(`Verification code info: ${JSON.stringify(value)}`);

    if (!value) {
      this.logger.debug('Verification code is expired');
      this.throwInvalidVerificationCodeValidationError();
    }

    const verificationInfo: VerificationInfo = JSON.parse(value);

    if (verificationInfo.tokenType != tokenType) {
      this.logger.debug(`Token type is not equal`);
      this.throwInvalidVerificationCodeValidationError();
    }

    const allowCodeAttempts = Number(
      this.config.getOrThrow<number>('ALLOW_CODE_ATTEMPTS'),
    );

    this.logger.debug(`Allow Code Attempts: ${allowCodeAttempts}`);

    if (verificationInfo.retryCount >= allowCodeAttempts) {
      this.logger.debug('Exceeds allow code attempts');

      this.throwInvalidVerificationCodeValidationError();
    }

    const isEqual = await compareHash(
      verificationCode.toString(),
      verificationInfo.code,
    );

    if (!isEqual) {
      verificationInfo.retryCount = verificationInfo.retryCount + 1;

      await this.verificationRedis.update(
        key,
        JSON.stringify(verificationInfo),
      );

      this.logger.debug(
        `Updated verification code info: ${JSON.stringify(verificationInfo)}`,
      );

      this.throwInvalidVerificationCodeValidationError();
    }

    this.logger.debug('checkVerificationCode End');

    return key;
  }

  async checkResendCodeAvailable(
    userId: string,
    deviceId: string,
    tokenType: TokenType,
  ): Promise<{ isAvailable: boolean; code?: number }> {
    this.logger.debug('checkResendCodeAvailable Start');

    const key = this.getVerificationKey(userId, deviceId);
    this.logger.debug(`Verification code key: ${key}`);

    const value = await this.verificationRedis.get(key);
    this.logger.debug(`Verification code info: ${JSON.stringify(value)}`);

    if (!value) {
      this.logger.debug('The verification code is expired');

      return { isAvailable: false };
    }

    const verificationInfo: VerificationInfo = JSON.parse(value);

    if (verificationInfo.tokenType != tokenType) {
      this.logger.debug(`Token type is not equal`);
      this.throwInvalidVerificationCodeValidationError();
    }

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

    this.logger.debug(`Send Code Available: ${isAvailable}`);

    let code: number = null;
    if (isAvailable) {
      const { verificationCode, hashedVerificationCode } =
        await this.generateVerificationCode();

      verificationInfo.code = hashedVerificationCode;
      verificationInfo.retryCount = 0;

      await this.verificationRedis.update(
        key,
        JSON.stringify(verificationInfo),
      );

      this.logger.debug(
        `Updated verification code info: ${JSON.stringify(verificationInfo)}`,
      );

      code = verificationCode;
    } else {
      await this.verificationRedis.delete(key);
      this.logger.debug(`Deleted verification code: ${key}`);
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
