import { getUserAgentDetails } from '@app/common';
import { TokenPairResponse } from '@app/common/grpc/auth-users';
import { AuthPrismaService, Device } from '@app/prisma/auth';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthType } from '../../enums/auth-type.enum';
import { Grant } from '../../enums/grant.enum';
import { TokensService } from '../../services/tokens.service';
import { ClientOauth } from '../../types/client-oauth.interface';
import { GenerateTokenPairDto } from '../dto/generate-token-pair.dto';
import { AuthUsersInfo } from '../types/users-auth-info.interface';

@Injectable()
export class GenerateTokenPairService {
  private readonly logger = new Logger(GenerateTokenPairService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: AuthPrismaService,
    private readonly tokenService: TokensService,
  ) {}

  async generateTokenPair(
    generateTokenPairDto: GenerateTokenPairDto,
  ): Promise<TokenPairResponse> {
    return await this.tokenService.transaction(async () => {
      const client: ClientOauth = {
        id: this.config.getOrThrow('USERS_APP_CLIENT_OAUTH_ID'),
        clientName: 'Users App',
        grants: [Grant.RefreshToken],
        redirectUri: '',
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

        const authInfo: AuthUsersInfo = {
          userId: generateTokenPairDto.userId,
          deviceId: device.id,
          userAgentId: userAgentDetails.id,
          tokenType: generateTokenPairDto.tokenType,
        };

        const currentTime = new Date();
        const expiresAt = new Date(
          currentTime.getTime() +
            generateTokenPairDto.accessTokenLifetime * 1000,
        );

        const result = await this.tokenService.saveToken(
          AuthType.Users,
          client,
          authInfo,
          generateTokenPairDto.accessTokenLifetime,
          generateTokenPairDto.refreshTokenLifetime,
        );

        return {
          accessToken: result.accessToken,
          expiresAt: expiresAt.getTime().toString(),
          tokenType: authInfo.tokenType,
          refreshToken: result.refreshToken,
          deviceId: authInfo.deviceId,
        };
      });
    });
  }
}
