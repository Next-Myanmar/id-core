import { DataResponse, Scope } from '@app/grpc/users-oauth';
import { UsersPrismaService } from '@app/prisma/users';
import { Injectable, Logger } from '@nestjs/common';
import { GetDataDto } from '../dto/get-data.dto';

@Injectable()
export class GetDataService {
  private readonly logger = new Logger(GetDataService.name);

  constructor(private readonly prisma: UsersPrismaService) {}

  async getData(getDataDto: GetDataDto): Promise<DataResponse> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: getDataDto.userId },
    });

    const data: DataResponse = {};

    if (getDataDto.scopes.includes(Scope.ReadEmail)) {
      data.email = user.email;
    }

    if (getDataDto.scopes.includes(Scope.ReadName)) {
      data.firstName = user.firstName;
      data.lastName = user.lastName;
    }

    return data;
  }
}
