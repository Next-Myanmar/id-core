import { checkPublic } from '@app/common';
import { AuthPrismaService } from '@app/prisma/auth';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthType } from '../enums/auth-type.enum';
import { TokenGeneratorService } from '../services/token-generator.service';
import { TokenInfo } from '../types/token-info.interface';
import { getTokenFromAuthorization } from '../utils/utils';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: AuthPrismaService,
    private readonly tokenService: TokenGeneratorService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = checkPublic(context, this.reflector);

    if (isPublic) {
      return true;
    }

    const type: string = context.getType();
    if (type !== 'http' && type !== 'graphql') {
      return true;
    }

    let req: any;
    if (type === 'http') {
      req = context.switchToHttp().getRequest();
    } else {
      req = GqlExecutionContext.create(context).getContext().req;
    }

    const authorization = req.headers?.authorization;

    if (!authorization) {
      throw new UnauthorizedException();
    }

    const accessToken = getTokenFromAuthorization(authorization);

    let tokenInfo: TokenInfo;
    for (const authType of Object.values(AuthType)) {
      tokenInfo = await this.tokenService.getAccessToken(authType, accessToken);
      if (tokenInfo) {
        break;
      }
    }

    if (!tokenInfo) {
      throw new UnauthorizedException();
    }

    req.auth = tokenInfo;

    const deviceId = tokenInfo.authInfo.deviceId;
    const geoip = '192.168.0.1';

    await this.prisma.loginHistory.upsert({
      where: { deviceId_geoip: { deviceId, geoip } },
      update: {
        lastLogin: new Date(),
      },
      create: {
        deviceId,
        geoip,
        lastLogin: new Date(),
        country: 'Japan',
        subDivision1: 'Itabashi',
        subDivision2: 'Takashimadaira',
        city: 'Tokyo',
      },
    });

    return true;
  }
}
