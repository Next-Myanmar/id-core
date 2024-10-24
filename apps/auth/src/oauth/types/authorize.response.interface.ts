import { AuthorizeStatus } from '../enums/authorize-status.enum';
import { Scope } from '../enums/scope.enum';

export interface CodeResponse {
  code: string;
}

export interface ScopeDetailResponse {
  scope: Scope;
  description: string;
}

export interface ConscentResponse {
  clientName: string;
  scopes: ScopeDetailResponse[];
}

export interface AuthorizeResponse {
  status: AuthorizeStatus;
  data: CodeResponse | ConscentResponse;
}
