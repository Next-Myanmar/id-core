import { TokenType } from '@app/common/grpc/auth-users';

export interface TokenPairResponse {
  accessToken: string;
  expiresAt: string;
  tokenType: TokenType;
  refreshToken: string;
}
