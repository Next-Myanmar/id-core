import { hash } from '@app/common';
import {
  AuthPrismaService,
  generateClientId,
  generateClientSecret,
} from '@app/prisma/auth';
import { Injectable, Logger } from '@nestjs/common';
import { CreateClientOauthDto } from '../dto/create-client-Oauth.dto';
import { ClientOauthEntity } from '../entities/client-oauth.entity';
import { GrantHelper } from '../enums/grant.enum';
import { convertToClientOauthEntity } from '../utils/entity-utils';

@Injectable()
export class CreateClientOauthService {
  private readonly logger = new Logger(CreateClientOauthService.name);

  constructor(private readonly authPrisma: AuthPrismaService) {}

  async createClientOauth(
    createClientOauthDto: CreateClientOauthDto,
  ): Promise<ClientOauthEntity> {
    const secret = generateClientSecret();

    const client = await this.authPrisma.clientOauth.create({
      data: {
        clientId: generateClientId(),
        clientName: createClientOauthDto.clientName,
        redirectUri: createClientOauthDto.redirectUri,
        grants: createClientOauthDto.grants.map((grant) =>
          GrantHelper.convertToGrantPrisma(grant),
        ),
        clientSecrets: {
          create: {
            name: createClientOauthDto.clientSecretName,
            secret: await hash(secret),
          },
        },
      },
      include: {
        clientSecrets: true,
      },
    });

    client.clientSecrets[0].secret = secret;

    return convertToClientOauthEntity(client);
  }
}
