import { DataResponse } from '@app/common/grpc/users-oauth';
import { Scope } from '../enums/scope.enum';

export interface AuthOauthInfo {
  userId: string;
  oauthUserId: string;

  deviceId: string;
  userAgentId: string;

  profile: DataResponse;

  scopes: Scope[];
}
