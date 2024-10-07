export interface Code {
  authorizationCode: string;
  expiresAt: Date;
  redirectUri: string;
  scope?: string | string[];
}
