import { checkPublic, getRequestFromContext } from '@app/common';
import { AuthUser, TokenType } from '@app/common/grpc/auth-users';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AUTH_TOKEN_TYPE_KEY } from '../decorators/auth-token-type.decorator';
import { Device, User } from '../prisma/generated';
import { PrismaService } from '../prisma/prisma.service';
import { TokenService } from '../token/token.service';
import { AuthInfo } from '../types/auth-info.interface';
import { updateLoginHistory } from '../utils/utils';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  private readonly conditions = {
    [TokenType.Normal]: { isUserVerified: true, isDeviceLogined: true },
    [TokenType.ActivateUser]: { isUserVerified: false, isDeviceLogined: false },
  };

  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
    private readonly token: TokenService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = checkPublic(context, this.reflector);

    if (isPublic) {
      return true;
    }
    const req: any = getRequestFromContext(context);

    let authUser: AuthUser;

    if (req.headers.auth) {
      authUser = req.headers.auth;
    } else {
      const authorization = req.headers?.authorization;

      if (!authorization) {
        throw new UnauthorizedException();
      }

      authUser = await this.token.authenticate(
        authorization,
        req.headers['user-agent'],
      );

      req.headers.auth = authUser;
    }

    let authTokenTypes = this.reflector.getAllAndOverride<TokenType[]>(
      AUTH_TOKEN_TYPE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!authTokenTypes) {
      authTokenTypes = [TokenType.Normal];
    }

    if (!authTokenTypes.includes(authUser.tokenType)) {
      throw new UnauthorizedException();
    }

    const condition = this.conditions[authUser.tokenType];

    const { user, device } = await this.getCurrentUserAndDevice(
      authUser,
      condition.isUserVerified,
      condition.isDeviceLogined,
    );

    const authInfo: AuthInfo = { authUser, user, device };

    req.headers.auth = authInfo;

    if (authTokenTypes.includes(TokenType.Normal)) {
      await updateLoginHistory(this.prisma, authUser.deviceId);
    }

    return true;
  }

  private async getCurrentUserAndDevice(
    authUser: AuthUser,
    isUserVerified: boolean,
    isDeviceLogined: boolean,
  ): Promise<{ user: User; device: Device }> {
    const result = await this.prisma.device.findUnique({
      where: {
        id: authUser.deviceId,
        isLogined: isDeviceLogined,
        user: { verified: isUserVerified },
      },
      include: { user: true },
    });

    if (!result) {
      throw new UnauthorizedException();
    }

    const user = result.user;
    const device = result;

    return { user, device };
  }
}
