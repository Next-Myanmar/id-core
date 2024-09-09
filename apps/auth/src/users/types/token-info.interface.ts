import { AuthUser } from '@app/common/grpc/auth-users';

export interface TokenInfo {
  accessToken: string;
  accessTokenExpiresAt: Date;
  accessTokenLifetime: number;
  refreshToken?: string;
  refreshTokenExpiresAt?: Date;
  refreshTokenLifetime?: number;
  user: AuthUser;
  userAgentId: string;
}
