import { AuthUser } from '@app/common/grpc/auth-users';
import { ClientOauth } from './client-oauth.interface';

export interface AccessTokenInfo {
  accessToken: string;
  accessTokenExpiresAt: Date;
  user: AuthUser;
  userAgentId: string;
  scope?: string | string[];
  client?: ClientOauth;
}
