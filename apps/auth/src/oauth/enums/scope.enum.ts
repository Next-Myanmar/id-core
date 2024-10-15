import { Scope as ScopeGrpc } from '@app/common/grpc/users-oauth';
import { Scope as ScopePrisma } from '@app/prisma/auth';

export enum Scope {
  ReadEmail = 'read:email',
  ReadName = 'read:name',
}

export class ScopeHelper {
  static convertToPrisma(scope: Scope): ScopePrisma {
    switch (scope) {
      case Scope.ReadEmail:
        return ScopePrisma.ReadEmail;
      case Scope.ReadName:
        return ScopePrisma.ReadName;
      default:
        return null;
    }
  }

  static convertToGrpc(scope: Scope): ScopeGrpc {
    switch (scope) {
      case Scope.ReadEmail:
        return ScopeGrpc.ReadEmail;
      case Scope.ReadName:
        return ScopeGrpc.ReadName;
      default:
        return null;
    }
  }
}
