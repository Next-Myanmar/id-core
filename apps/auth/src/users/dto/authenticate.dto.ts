import { IsNotEmpty } from 'class-validator';

export class AuthenticateDto {
  @IsNotEmpty()
  authorization: string;

  @IsNotEmpty()
  ua: string;
}
