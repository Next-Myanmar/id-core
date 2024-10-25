import { TokenType } from '@app/grpc/auth-users';

export interface TokenPairResponse {
  accessToken: string;
  expiresIn: number;
  tokenType: TokenType;
  refreshToken: string;
}
