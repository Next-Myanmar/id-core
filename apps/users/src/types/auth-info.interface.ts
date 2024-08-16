import { AuthUser } from '@app/common/grpc/auth-users';
import { Device, User } from '../prisma/generated';

export interface AuthInfo {
  authUser: AuthUser;
  user: User;
  device: Device;
}
