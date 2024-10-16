import { User, UsersPrismaService } from '@app/prisma/users';
import { Injectable, Logger } from '@nestjs/common';
import { UpdatePersonalDetailsDto } from '../dto/update-personal-details.dto';
import { PersonalDetailsEntity } from '../entities/personal-details.entity';
import { convertToUserEntity } from '../utils/entity-utils';

@Injectable()
export class UpdatePersonalDetailsService {
  private readonly logger = new Logger(UpdatePersonalDetailsService.name);

  constructor(private readonly prisma: UsersPrismaService) {}

  async updatePersonalDetails(
    user: User,
    updatePersonalDetailsDto: UpdatePersonalDetailsDto,
  ): Promise<PersonalDetailsEntity> {
    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: updatePersonalDetailsDto,
    });

    return convertToUserEntity(updatedUser);
  }
}
