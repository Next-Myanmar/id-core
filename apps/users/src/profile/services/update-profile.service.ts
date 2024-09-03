import { Injectable, Logger } from '@nestjs/common';
import { User } from '../../prisma/generated';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { UserEntity } from '../entities/user.entity';
import { convertToUserEntity } from '../utils/entity-utils';

@Injectable()
export class UpdateProfileService {
  private readonly logger = new Logger(UpdateProfileService.name);

  constructor(private readonly prisma: PrismaService) {}

  async updateProfile(
    user: User,
    updateProfileDto: UpdateProfileDto,
  ): Promise<UserEntity> {
    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: updateProfileDto,
    });

    return convertToUserEntity(updatedUser);
  }
}
