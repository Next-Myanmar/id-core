import { AuthType } from '../enums/auth-type.enum';
import { AuthOauthInfo } from './auth-oauth-info.interface';
import { ClientOauth } from './client-oauth.interface';
import { AuthUsersInfo } from './users-auth-info.interface';

export interface TokenInfo {
  accessToken: string;

  accessTokenLifetime: number;

  refreshToken?: string;

  refreshTokenLifetime?: number;

  client: ClientOauth;

  authInfo: AuthUsersInfo | AuthOauthInfo;

  authType: AuthType;
}
