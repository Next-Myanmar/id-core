import { ClientOauth, ClientSecret } from '@app/prisma/auth';
import { ClientOauthEntity } from '../entities/client-oauth.entity';
import { GrantHelper } from '../enums/grant.enum';

export function convertToClientOauthEntity(
  client: ClientOauth & { clientSecrets: ClientSecret[] },
): ClientOauthEntity {
  return {
    id: client.id,
    clientId: client.clientId,
    clientName: client.clientName,
    redirectUri: client.redirectUri,
    grants: client.grants.map((grant) => GrantHelper.convertToGrant(grant)),
    clientSecrets: client.clientSecrets.map((secret) => ({
      id: secret.id,
      name: secret.name,
      secret: secret.secret,
    })),
  };
}
