import { AuthInfo } from './auth-info.interface';
import { ClientOauth } from './client-oauth.interface';

export interface AuthTokenInfo {
  client: ClientOauth;
  authInfo: AuthInfo;
}
