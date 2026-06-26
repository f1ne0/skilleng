import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ExamType } from "@prisma/client";
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

export class CreateExamDto {
  @ApiProperty()
  @IsUUID()
  courseId: string;

  @ApiProperty({ example: "Checkpoint: Units 1-3" })
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title: string;

  @ApiProperty({ enum: ExamType, example: "CHECKPOINT" })
  @IsEnum(ExamType)
  type: ExamType;

  @ApiPropertyOptional({ example: "Units 1-3", description: "Диапазон юнитов; пусто — весь курс" })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  unitsLabel?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, example: 60 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  passingScore?: number;
}
