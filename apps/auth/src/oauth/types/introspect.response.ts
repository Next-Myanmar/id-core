export interface IntrospectResponse {
  active: boolean;

  client_id?: string;

  scope?: string;

  exp?: number;

  user_id?: string;
}
