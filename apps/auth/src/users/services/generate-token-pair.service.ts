import { RedisService } from '@app/common';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { TOKEN_REDIS_PROVIDER } from '../../redis/token-redis.module';
import { TokenService } from '../../token/token.service';
import { TokenInfo } from '../../types/token-info.interface';
import { GenerateTokenPairDto } from '../dto/generate-token-pair.dto';

@Injectable()
export class GenerateTokenPairService {
  private readonly logger = new Logger(GenerateTokenPairService.name);

  constructor(
    @Inject(TOKEN_REDIS_PROVIDER)
    private readonly tokenRedis: RedisService,
    private readonly tokenService: TokenService,
  ) {}

  async generateTokenPair(
    generateTokenPairDto: GenerateTokenPairDto,
  ): Promise<TokenInfo> {
    const result = this.tokenRedis.transaction(async () => {
      return await this.tokenService.saveUsersToken(
        generateTokenPairDto.userId,
        generateTokenPairDto.userAgentId,
        generateTokenPairDto.accessTokenLifetime,
        generateTokenPairDto.tokenType,
        generateTokenPairDto.refreshTokenLifetime,
      );
    });

    return result;
  }
}
