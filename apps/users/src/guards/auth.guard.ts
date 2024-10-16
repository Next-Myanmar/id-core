import { checkPublic } from '@app/common';
import { AuthUser, TokenType } from '@app/grpc/auth-users';
import { User, UsersPrismaService } from '@app/prisma/users';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthUsersService } from '../../../../libs/grpc/src/auth-users/auth-users.service';
import { AUTH_TOKEN_TYPE_KEY } from '../decorators/auth-token-type.decorator';
import { AuthInfo } from '../types/auth-info.interface';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  private readonly conditions: Record<TokenType, { isUserVerified?: boolean }> =
    {
      [TokenType.Normal]: { isUserVerified: true },
      [TokenType.ActivateUser]: { isUserVerified: false },
      [TokenType.VerifyLogin]: { isUserVerified: true },
      [TokenType.UNRECOGNIZED]: undefined,
    };

  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: UsersPrismaService,
    private readonly authUsers: AuthUsersService,
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

    let authUser: AuthUser;

    if (req.headers.auth) {
      authUser = req.headers.auth;
    } else {
      const authorization = req.headers?.authorization;

      if (!authorization) {
        throw new UnauthorizedException();
      }

      authUser = await this.authUsers.authenticate({
        authorization,
        ua: req.headers['user-agent'],
      });

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

    const user = await this.getCurrentUser(authUser, condition.isUserVerified);

    const authInfo: AuthInfo = { authUser, user };

    req.auth = authInfo;

    return true;
  }

  private async getCurrentUser(
    authUser: AuthUser,
    isUserVerified: boolean,
  ): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: {
        id: authUser.userId,
        verified: isUserVerified,
      },
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    return user;
  }
}
