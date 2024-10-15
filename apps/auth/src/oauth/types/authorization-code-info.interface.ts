import { ClientOauth } from '../../types/client-oauth.interface';
import { CodeChallengeMethod } from '../enums/code-challenge-method.enum';
import { AuthOauthInfo } from './auth-oauth-info.interface';

export interface AuthorizationCodeInfo {
  code: string;

  redirectUri: string;

  codeChallenge: string;

  codeChallengeMethod: CodeChallengeMethod;

  client: ClientOauth;

  authInfo: AuthOauthInfo;
}
