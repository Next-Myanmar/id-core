import { NumberLength } from '@app/common/validators';
import { IsEmail, IsNotEmpty, IsOptional } from 'class-validator';

export class SendVerifyLoginEmailDto {
  @IsEmail()
  recipient: string;

  @IsNotEmpty()
  firstName: string;

  @IsOptional()
  @IsNotEmpty()
  lastName?: string;

  @NumberLength(6, 6)
  code: number;
}
