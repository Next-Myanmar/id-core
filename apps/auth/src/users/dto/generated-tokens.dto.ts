import { IsUnique } from '@app/common';
import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, ValidateNested } from 'class-validator';
import { GeneratedTokenDto } from './generated-token.dto';

export class GeneratedTokensDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @IsUnique(['userId', 'deviceId'])
  @Type(() => GeneratedTokenDto)
  generatedTokens: GeneratedTokenDto[];
}
