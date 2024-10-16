import { TokenType } from '@app/grpc/auth-users';

export interface TokenPairResponse {
  accessToken: string;
  expiresAt: string;
  tokenType: TokenType;
  refreshToken: string;
}
