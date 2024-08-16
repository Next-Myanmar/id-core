import { AuthUser } from '@app/common/grpc/auth-users';
import { ClientOauth } from './client-oauth.interface';

export interface TokenInfo {
  accessToken: string;
  accessTokenExpiresAt: Date;
  accessTokenLifetime: number;
  refreshToken?: string;
  refreshTokenExpiresAt?: Date;
  refreshTokenLifetime?: number;
  user: AuthUser;
  userAgentId: string;
  scope?: string | string[];
  client?: ClientOauth;
}
