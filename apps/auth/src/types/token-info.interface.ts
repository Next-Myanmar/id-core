import { ClientOauth } from '@prisma/client';

export interface TokenInfo {
  accessToken: string;
  accessTokenExpiresAt: Date;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
  user: any;
  userAgentId: string;
  scope?: string | string[];
  client?: ClientOauth;
}
