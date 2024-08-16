import {
  compareHash,
  hash,
  I18nValidationException,
  i18nValidationMessage,
  RedisService,
} from '@app/common';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VERIFICATION_REDIS_PROVIDER } from '../../redis/verification-redis.module';
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

  async createVerificationCode(
    userId: string,
    deviceId: string,
  ): Promise<number> {
    this.logger.debug('createVerificationCode Start');

    const verificationCode = Math.floor(100000 + Math.random() * 900000);

    const hashedVerificationCode = await hash(verificationCode.toString());

    const key = this.getVerificationKey(userId, deviceId);

    const verificationInfo: VerificationInfo = {
      code: hashedVerificationCode,
      retryCount: 0,
    };

    const lifetime = Number(this.config.getOrThrow<number>('CODE_LIFETIME'));

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
      } else {
        await this.verificationRedis.delete(key);
      }

      this.logger.debug(`Retry Count: ${verificationInfo.retryCount}`);

      this.throwInvalidVerificationCodeValidationError();
    }

    this.logger.debug('checkVerificationCode End');

    return key;
  }

  private throwInvalidVerificationCodeValidationError(): never {
    throw I18nValidationException.create({
      property: 'code',
      message: i18nValidationMessage({
        property: 'property.Code',
        message: 'validation.INVALID',
      }),
    });
  }
}
