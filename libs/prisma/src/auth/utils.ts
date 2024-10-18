import { randomBytes } from 'crypto';

export function generateClientId() {
  return randomBytes(16).toString('hex');
}

export function generateClientSecret() {
  return randomBytes(32).toString('hex');
}
