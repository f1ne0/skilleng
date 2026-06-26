import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { CefrLevel } from "@prisma/client";
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

export enum ReadingLength {
  SHORT = "SHORT", // ~100-150 слов
  MEDIUM = "MEDIUM", // ~200-300 слов
  LONG = "LONG", // ~400-500 слов
}

export class GenerateReadingDto {
  @ApiProperty({ example: "Remote work culture" })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  topic: string;

  @ApiProperty({ enum: CefrLevel, example: "B2" })
  @IsEnum(CefrLevel)
  level: CefrLevel;

  @ApiProperty({ enum: ReadingLength, example: "MEDIUM" })
  @IsEnum(ReadingLength)
  length: ReadingLength;

  @ApiPropertyOptional({ minimum: 1, maximum: 8, default: 4 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(8)
  questionCount?: number = 4;
}
