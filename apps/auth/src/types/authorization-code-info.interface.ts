import { AuthInfo } from './auth-info.interface';
import { ClientOauth } from './client-oauth.interface';

export interface AuthorizationCodeInfo {
  authorizationCode: string;
  expiresAt: Date;
  redirectUri: string;
  client: ClientOauth;
  authInfo: AuthInfo;
  scope?: string | string[];
}
