import { Grant } from '../enums/grant.enum';

export interface ClientOauth {
  id: string;

  clientId: string;

  homeUri: string;

  grants: Grant[];
}
