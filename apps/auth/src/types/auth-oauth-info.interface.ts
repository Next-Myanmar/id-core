import { Profile } from '@app/grpc/users-oauth';
import { Scope } from '../oauth/enums/scope.enum';

export interface AuthOauthInfo {
  userId: string;
  oauthUserId: string;

  deviceId: string;
  userAgentId: string;

  profile: Profile;

  scopes: Scope[];
}
