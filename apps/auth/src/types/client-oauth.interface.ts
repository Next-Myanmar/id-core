import { Grant } from '../enums/grant.enum';

export interface ClientOauth {
  id: string;

  clientName: string;

  grants: Grant[];

  redirectUri: string;
}
