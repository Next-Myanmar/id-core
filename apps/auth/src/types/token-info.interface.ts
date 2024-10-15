import { AuthType } from '../enums/auth-type.enum';
import { AuthOauthInfo } from '../oauth/types/auth-oauth-info.interface';
import { AuthUsersInfo } from '../users/types/users-auth-info.interface';
import { ClientOauth } from './client-oauth.interface';

export interface TokenInfo {
  accessToken: string;

  accessTokenLifetime: number;

  refreshToken?: string;

  refreshTokenLifetime?: number;

  client: ClientOauth;

  authInfo: AuthUsersInfo | AuthOauthInfo;

  authType: AuthType;
}
