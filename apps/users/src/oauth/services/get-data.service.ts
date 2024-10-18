import { Profile, Scope } from '@app/grpc/users-oauth';
import { UsersPrismaService } from '@app/prisma/users';
import { Injectable, Logger } from '@nestjs/common';
import { GetProfileDto } from '../dto/get-profile.dto';

@Injectable()
export class GetProfileService {
  private readonly logger = new Logger(GetProfileService.name);

  constructor(private readonly prisma: UsersPrismaService) {}

  async getData(getProfileDto: GetProfileDto): Promise<Profile> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: getProfileDto.userId },
    });

    const data: Profile = {};

    if (getProfileDto.scopes.includes(Scope.ReadEmail)) {
      data.email = user.email;
    }

    if (getProfileDto.scopes.includes(Scope.ReadName)) {
      data.firstName = user.firstName;
      data.lastName = user.lastName;
    }

    return data;
  }
}
