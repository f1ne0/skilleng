import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { CefrLevel, CourseCategory } from "@prisma/client";
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

export class GenerateCourseDto {
  @ApiProperty({ example: "Business English for meetings" })
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  topic: string;

  @ApiProperty({ enum: CefrLevel, example: "B1" })
  @IsEnum(CefrLevel)
  level: CefrLevel;

  @ApiProperty({ minimum: 3, maximum: 8, example: 5 })
  @IsInt()
  @Min(3)
  @Max(8)
  lessonCount: number;

  @ApiPropertyOptional({ enum: CourseCategory, example: "GENERAL_ENGLISH" })
  @IsOptional()
  @IsEnum(CourseCategory)
  category?: CourseCategory;
}
