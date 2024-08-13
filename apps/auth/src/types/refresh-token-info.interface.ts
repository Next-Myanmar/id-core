import { ClientOauth } from '@prisma/client';

export interface RefreshTokenInfo {
  refreshToken: string;
  refreshTokenExpiresAt: Date;
  user: any;
  userAgentId: string;
  scope?: string | string[];
  client?: ClientOauth;
}
