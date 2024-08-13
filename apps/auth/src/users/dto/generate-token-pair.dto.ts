import { IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator';

export class GenerateTokenPairDto {
  @IsNotEmpty()
  userId: string;

  @IsNotEmpty()
  userAgentId: string;

  @Min(60)
  @IsNumber({ allowNaN: false })
  accessTokenLifetime: number;

  @IsOptional()
  @Min(60)
  @IsNumber()
  refreshTokenLifetime?: number;
}
