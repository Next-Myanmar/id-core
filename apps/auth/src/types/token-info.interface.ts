import { ClientOauth } from './client-oauth.interface';

export interface TokenInfo {
  accessToken: string;
  accessTokenExpiresAt: Date;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
  user: any;
  userAgentId: string;
  scope?: string | string[];
  client?: ClientOauth;
}
