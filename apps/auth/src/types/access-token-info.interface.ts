import { ClientOauth } from './client-oauth.interface';

export interface AccessTokenInfo {
  accessToken: string;
  accessTokenExpiresAt: Date;
  user: any;
  userAgentId: string;
  scope?: string | string[];
  client?: ClientOauth;
}
