import { TokenType } from '@app/common/grpc/auth-users';

export interface KeysInfo {
  accessTokenKey: string;
  refreshTokenKey?: string;
  tokenType: TokenType;
}
