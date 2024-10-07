import { UnauthorizedException } from '@nestjs/common';
import { randomBytes } from 'crypto';

export function getTokenFromAuthorization(authorization: string) {
  if (!authorization.startsWith('Bearer ')) {
    throw new UnauthorizedException();
  }
  return authorization.substring(7);
}

export function generateClientId() {
  return randomBytes(16).toString('hex');
}

export function generateClientSecret() {
  return randomBytes(32).toString('hex');
}
