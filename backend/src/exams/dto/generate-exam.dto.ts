import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { QuestionType } from "@prisma/client";
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  Max,
  Min,
} from "class-validator";

export class GenerateExamDto {
  @ApiPropertyOptional({
    description: "Сколько вопросов сгенерировать (всего в экзамене)",
    minimum: 4,
    maximum: 30,
    default: 10,
  })
  @IsOptional()
  @IsInt()
  @Min(4)
  @Max(30)
  count?: number;

  @ApiPropertyOptional({
    description: "Типы вопросов (пусто = все авто-проверяемые)",
    enum: QuestionType,
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(QuestionType, { each: true })
  types?: QuestionType[];
}
