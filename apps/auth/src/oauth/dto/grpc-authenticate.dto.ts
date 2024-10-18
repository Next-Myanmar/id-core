import { IsNotEmpty } from 'class-validator';

export class GrpcAuthenticateDto {
  @IsNotEmpty()
  clientId: string;

  @IsNotEmpty()
  clientSecret: string;

  @IsNotEmpty()
  authorization: string;
}
