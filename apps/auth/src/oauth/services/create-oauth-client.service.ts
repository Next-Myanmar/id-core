import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class CreateOauthClientService {
  private readonly logger = new Logger(CreateOauthClientService.name);

  constructor() {}

  // async createOauthClient(createOauthClientDto: CreateOauthClientDto): Promise<> {}
}
