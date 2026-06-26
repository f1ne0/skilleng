import { ApiProperty } from "@nestjs/swagger";
import { QuestionType } from "@prisma/client";
import {
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

export class CreateQuestionDto {
  @ApiProperty({ enum: QuestionType, example: "MULTIPLE_CHOICE" })
  @IsEnum(QuestionType)
  type: QuestionType;

  @ApiProperty({
    example: "What is the capital of France?",
    minLength: 5,
    maxLength: 2000,
  })
  @IsString()
  @MinLength(5)
  @MaxLength(2000)
  prompt: string;

  @ApiProperty({
    description: "Type-specific data. See QuestionType. Validated server-side.",
    example: { options: ["Paris", "London"], correctIndex: 0 },
  })
  @IsObject()
  payload: Record<string, unknown>;
  // Конкретная структура зависит от type — валидируется в сервисе через
  // соответствующий payload-класс. На уровне DTO просто проверяем что объект.

  @ApiProperty({ required: false, maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  explanation?: string;

  @ApiProperty({ required: false, default: 10, minimum: 1, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  points?: number;
}
