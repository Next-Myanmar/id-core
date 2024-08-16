import { TokenType } from '@app/common/grpc/auth-users';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator';

export class GenerateTokenPairDto {
  @IsNotEmpty()
  userId: string;

  @IsNotEmpty()
  deviceId: string;

  @IsNotEmpty()
  userAgentSource: string;

  @Min(60)
  @IsNumber({ allowNaN: false })
  accessTokenLifetime: number;

  @IsEnum(TokenType)
  tokenType: TokenType;

  @IsOptional()
  @Min(60)
  @IsNumber()
  refreshTokenLifetime?: number;
}
