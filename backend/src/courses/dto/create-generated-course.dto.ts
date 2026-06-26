import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { CefrLevel, CourseCategory, QuestionType } from "@prisma/client";
import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from "class-validator";

export class GeneratedQuestionDto {
  @ApiProperty({ enum: QuestionType })
  @IsEnum(QuestionType)
  type: QuestionType;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  prompt: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  explanation?: string;

  // payload детально валидируется по типу на сервере (validatePayloadByType).
  // Здесь @IsObject — чтобы поле прошло whitelist глобального ValidationPipe.
  @ApiProperty({ type: Object })
  @IsObject()
  payload: Record<string, unknown>;
}

export class GeneratedLessonDto {
  @ApiProperty()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty()
  @IsString()
  @MinLength(10)
  content: string;

  @ApiProperty({ type: [GeneratedQuestionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GeneratedQuestionDto)
  questions: GeneratedQuestionDto[];
}

export class CreateGeneratedCourseDto {
  @ApiProperty()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title: string;

  @ApiProperty()
  @IsString()
  @MinLength(3)
  @MaxLength(2000)
  description: string;

  @ApiPropertyOptional({ enum: CefrLevel })
  @IsOptional()
  @IsEnum(CefrLevel)
  level?: CefrLevel;

  @ApiProperty({ enum: CourseCategory })
  @IsEnum(CourseCategory)
  category: CourseCategory;

  @ApiProperty({ type: [GeneratedLessonDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => GeneratedLessonDto)
  lessons: GeneratedLessonDto[];
}
