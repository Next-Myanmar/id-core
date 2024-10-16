import { AuthUser } from '@app/grpc/auth-users';
import { User } from '@app/prisma/users';

export interface AuthInfo {
  authUser: AuthUser;
  user: User;
}
