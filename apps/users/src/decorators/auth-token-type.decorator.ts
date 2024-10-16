import { TokenType } from '@app/grpc/auth-users';
import { SetMetadata } from '@nestjs/common';

export const AUTH_TOKEN_TYPE_KEY = 'auth-token-types';

export const AuthTokenTypes = (...tokeyTypes: TokenType[]): MethodDecorator =>
  SetMetadata(AUTH_TOKEN_TYPE_KEY, tokeyTypes);
