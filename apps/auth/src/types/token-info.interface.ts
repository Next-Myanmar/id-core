import { AuthUser } from '@app/common/grpc/auth-users';
import { ClientOauth } from './client-oauth.interface';

export interface TokenInfo {
  accessToken: string;
  accessTokenExpiresAt: Date;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
  user: AuthUser;
  userAgentId: string;
  scope?: string | string[];
  client?: ClientOauth;
}
