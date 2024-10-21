import { IsNotEmpty } from 'class-validator';

export class GrpcAuthenticateDto {
  @IsNotEmpty()
  authorization: string;
}
