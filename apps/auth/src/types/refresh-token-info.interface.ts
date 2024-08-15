import { ClientOauth } from './client-oauth.interface';

export interface RefreshTokenInfo {
  refreshToken: string;
  refreshTokenExpiresAt: Date;
  user: any;
  userAgentId: string;
  scope?: string | string[];
  client?: ClientOauth;
}
