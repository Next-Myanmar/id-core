import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, ValidateNested } from 'class-validator';
import { GeneratedTokenDto } from './generated-token.dto';

export class GeneratedTokensDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => GeneratedTokenDto)
  generatedTokens: GeneratedTokenDto[];
}
