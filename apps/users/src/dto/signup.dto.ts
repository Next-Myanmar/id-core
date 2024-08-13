import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsStrongPassword,
} from 'class-validator';

export class SignupDto {
  @IsEmail()
  email: string;

  @IsStrongPassword()
  password: string;

  @IsNotEmpty()
  firstName: string;

  @IsOptional()
  @IsNotEmpty()
  lastName?: string;
}
