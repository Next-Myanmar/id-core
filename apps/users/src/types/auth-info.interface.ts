import { AuthUser } from '@app/common/grpc/auth-users';
import { User } from '../prisma/generated';

export interface AuthInfo {
  authUser: AuthUser;
  user: User;
}
