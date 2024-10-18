import { Scope } from '@app/grpc/users-oauth';
import { ArrayNotEmpty, IsArray, IsEnum, IsNotEmpty } from 'class-validator';

export class GetProfileDto {
  @IsNotEmpty()
  userId: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(Scope, { each: true })
  scopes: Scope[];
}
