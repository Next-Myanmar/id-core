import { TokenType } from '@app/common/grpc/auth-users';
import { IsEnum, IsNotEmpty } from 'class-validator';

export class GeneratedTokenDto {
  @IsNotEmpty()
  userId: string;

  @IsNotEmpty()
  deviceId: string;

  @IsEnum(TokenType)
  tokenType: TokenType;
}
