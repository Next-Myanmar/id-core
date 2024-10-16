import { TokenType } from '@app/grpc/auth-users';

export interface VerificationInfo {
  code: string;
  retryCount: number;
  resendCodeCount: number;
  tokenType: TokenType;
}
