import { Grant } from '../enums/grant.enum';

export interface ClientOauth {
  id: string;

  clientId: string;

  clientName: string;

  grants: Grant[];

  redirectUri: string;
}
