import { Grant as GrantPrisma } from '@app/prisma/auth';

export enum ResponseType {
  code = 'code',
}

export class ResponseTypeHelper {
  static convertToGrantPrisma(responseType: ResponseType): GrantPrisma {
    switch (responseType) {
      case ResponseType.code:
        return GrantPrisma.AuthorizationCode;
      default:
        return null;
    }
  }
}
