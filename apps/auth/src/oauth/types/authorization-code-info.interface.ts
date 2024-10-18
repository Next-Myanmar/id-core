import { AuthOauthInfo } from '../../types/auth-oauth-info.interface';
import { ClientOauth } from '../../types/client-oauth.interface';
import { CodeChallengeMethod } from '../enums/code-challenge-method.enum';

export interface AuthorizationCodeInfo {
  code: string;

  redirectUri: string;

  codeChallenge: string;

  codeChallengeMethod: CodeChallengeMethod;

  client: ClientOauth;

  authInfo: AuthOauthInfo;
}
