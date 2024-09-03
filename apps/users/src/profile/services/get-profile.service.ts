import { Injectable, Logger } from '@nestjs/common';
import { User } from '../../prisma/generated';
import { UserEntity } from '../entities/user.entity';
import { convertToUserEntity } from '../utils/entity-utils';

@Injectable()
export class GetProfileService {
  private readonly logger = new Logger(GetProfileService.name);

  constructor() {}

  async getProfile(user: User): Promise<UserEntity> {
    return convertToUserEntity(user);
  }
}
