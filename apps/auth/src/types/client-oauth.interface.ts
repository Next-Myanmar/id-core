import { Grant } from "../prisma/generated";

export interface ClientOauth {
  id: string;
  name: string;
  grants: Grant[];
}
