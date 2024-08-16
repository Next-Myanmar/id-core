import { IsEmail, IsNotEmpty, IsOptional } from 'class-validator';

export class SendWelcomeUserEmailDto {
  @IsEmail()
  recipient: string;

  @IsNotEmpty()
  firstName: string;

  @IsOptional()
  @IsNotEmpty()
  lastName?: string;
}
