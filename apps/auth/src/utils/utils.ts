import { UnauthorizedException } from '@nestjs/common';

export function getTokenFromAuthorization(authorization: string) {
  if (!authorization.startsWith('Bearer ')) {
    throw new UnauthorizedException();
  }
  return authorization.substring(7);
}
