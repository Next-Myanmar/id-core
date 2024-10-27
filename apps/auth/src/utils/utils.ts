import { UnauthorizedException } from '@nestjs/common';

export function getTokenFromAuthorization(authorization: string) {
  if (!authorization.startsWith('Bearer ')) {
    throw new UnauthorizedException();
  }
  return authorization.substring(7);
}

export function getTimestamp(lifetimeInSeconds: number) {
  const timestamp = new Date();

  timestamp.setSeconds(timestamp.getSeconds() + lifetimeInSeconds);

  return timestamp.getTime();
}
