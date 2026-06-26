import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { CefrLevel, QuestionType } from "@prisma/client";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

export enum ContentSkill {
  READING = "READING",
  LISTENING = "LISTENING",
  SPEAKING = "SPEAKING",
  WRITING = "WRITING",
  GRAMMAR = "GRAMMAR",
  VOCABULARY = "VOCABULARY",
}

export class GenerateQuestionsDto {
  @ApiProperty({ example: "Travel and airports" })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  topic: string;

  @ApiProperty({ enum: CefrLevel, example: "B1" })
  @IsEnum(CefrLevel)
  level: CefrLevel;

  @ApiPropertyOptional({ enum: ContentSkill, example: "VOCABULARY" })
  @IsOptional()
  @IsEnum(ContentSkill)
  skill?: ContentSkill;

  @ApiProperty({
    enum: QuestionType,
    isArray: true,
    example: ["MULTIPLE_CHOICE", "FILL_BLANK"],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  @IsEnum(QuestionType, { each: true })
  types: QuestionType[];

  @ApiProperty({ minimum: 1, maximum: 10, example: 5 })
  @IsInt()
  @Min(1)
  @Max(10)
  count: number;
}
