import { getUserAgentDetails } from '@app/common';
import { TokenPairResponse } from '@app/common/grpc/auth-users';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Device, Grant } from '../../prisma/generated';
import { PrismaService } from '../../prisma/prisma.service';
import { TokenService } from '../../services/token.service';
import { AuthInfo } from '../../types/auth-info.interface';
import { ClientOauth } from '../../types/client-oauth.interface';
import { GenerateTokenPairDto } from '../dto/generate-token-pair.dto';

@Injectable()
export class GenerateTokenPairService {
  private readonly logger = new Logger(GenerateTokenPairService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
  ) {}

  async generateTokenPair(
    generateTokenPairDto: GenerateTokenPairDto,
  ): Promise<TokenPairResponse> {
    const result = await this.tokenService.transaction(async () => {
      const client: ClientOauth = {
        id: this.config.getOrThrow('USERS_APP_CLIENT_OAUTH_ID'),
        name: 'Users App',
        grants: [Grant.refresh_token],
      };

      const userAgentDetails = getUserAgentDetails(generateTokenPairDto.ua);

      return this.prisma.transaction(async (prisma) => {
        let device: Device;
        if (generateTokenPairDto.deviceId) {
          device = await prisma.device.update({
            where: {
              id: generateTokenPairDto.deviceId,
            },
            data: { ua: generateTokenPairDto.ua },
          });
        } else {
          device = await prisma.device.create({
            data: {
              clientOauthId: client.id,
              userId: generateTokenPairDto.userId,
              ua: generateTokenPairDto.ua,
            },
          });
        }

        const authInfo: AuthInfo = {
          userId: generateTokenPairDto.userId,
          deviceId: device.id,
          userAgentId: userAgentDetails.id,
          tokenType: generateTokenPairDto.tokenType,
          refreshTokenLifetime: generateTokenPairDto.refreshTokenLifetime,
          accessTokenLifetime: generateTokenPairDto.accessTokenLifetime,
        };

        return await this.tokenService.saveUsersToken(
          client,
          authInfo,
          generateTokenPairDto.accessTokenLifetime,
          generateTokenPairDto.refreshTokenLifetime,
        );
      });
    });

    const data: TokenPairResponse = {
      accessToken: result.accessToken,
      expiresAt: result.accessTokenExpiresAt.getTime().toString(),
      tokenType: result.authInfo.tokenType,
      refreshToken: result.refreshToken,
      deviceId: result.authInfo.deviceId,
    };

    return data;
  }
}
