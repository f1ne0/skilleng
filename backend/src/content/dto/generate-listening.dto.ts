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

export enum ListeningFormat {
  MONOLOGUE = "MONOLOGUE", // один голос
  DIALOGUE = "DIALOGUE", // два спикера (мультиспикер TTS)
}

export class GenerateListeningDto {
  @ApiProperty({ example: "Ordering food at a restaurant" })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  topic: string;

  @ApiProperty({ enum: CefrLevel, example: "A2" })
  @IsEnum(CefrLevel)
  level: CefrLevel;

  @ApiProperty({ enum: ListeningFormat, example: "DIALOGUE" })
  @IsEnum(ListeningFormat)
  format: ListeningFormat;

  @ApiPropertyOptional({ minimum: 1, maximum: 8, default: 4 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(8)
  questionCount?: number = 4;
}
