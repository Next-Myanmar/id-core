import { Gender } from '../../enums/gender.enum';
import { User } from '../../prisma/generated';
import { UserEntity } from '../entities/user.entity';

export function convertToUserEntity(user: User): UserEntity {
  return {
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName ? user.lastName : undefined,
    dateOfBirth: user.dateOfBirth
      ? user.dateOfBirth.toISODateString()
      : undefined,
    gender: user.gender ? (user.gender as Gender) : undefined,
  };
}
