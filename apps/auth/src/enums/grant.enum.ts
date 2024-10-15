import { Grant as GrantPrisma } from '@app/prisma/auth';

export enum Grant {
  AuthorizationCode = 'authorization_code',
  RefreshToken = 'refresh_token',
}

export class GrantHelper {
  static convertToGrant(grant: GrantPrisma): Grant {
    switch (grant) {
      case GrantPrisma.AuthorizationCode:
        return Grant.AuthorizationCode;
      case GrantPrisma.RefreshToken:
        return Grant.RefreshToken;
      default:
        return null;
    }
  }

  static convertToGrantPrisma(grant: Grant): GrantPrisma {
    switch (grant) {
      case Grant.AuthorizationCode:
        return GrantPrisma.AuthorizationCode;
      case Grant.RefreshToken:
        return GrantPrisma.RefreshToken;
      default:
        return null;
    }
  }
}
