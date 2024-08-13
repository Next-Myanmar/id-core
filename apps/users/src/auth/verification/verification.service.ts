import { hash, RedisService } from '@app/common';
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
}
