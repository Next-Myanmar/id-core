import { AuthInfo } from './auth-info.interface';
import { ClientOauth } from './client-oauth.interface';

export interface TokenInfo {
  accessToken: string;
  accessTokenExpiresAt: Date;
  refreshToken?: string;
  refreshTokenExpiresAt?: Date;
  scope?: string | string[];
  client: ClientOauth;
  authInfo: AuthInfo;
}
