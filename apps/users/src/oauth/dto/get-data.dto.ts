import { Scope } from '@app/grpc/users-oauth';
import { IsArray, IsEnum, IsNotEmpty } from 'class-validator';

export class GetDataDto {
  @IsNotEmpty()
  userId: string;

  @IsArray()
  @IsEnum(Scope, { each: true })
  scopes: Scope[];
}
