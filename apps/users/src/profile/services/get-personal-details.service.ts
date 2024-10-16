import { User } from '@app/prisma/users';
import { Injectable, Logger } from '@nestjs/common';
import { PersonalDetailsEntity } from '../entities/personal-details.entity';
import { convertToUserEntity } from '../utils/entity-utils';

@Injectable()
export class GetPersonalDetailsService {
  private readonly logger = new Logger(GetPersonalDetailsService.name);

  constructor() {}

  async getPersonalDetails(user: User): Promise<PersonalDetailsEntity> {
    return convertToUserEntity(user);
  }
}
