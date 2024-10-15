import { TokenType } from '@app/common/grpc/auth-users';

export interface AuthUsersInfo {
  userId: string;

  deviceId: string;
  userAgentId: string;

  tokenType: TokenType;
}
