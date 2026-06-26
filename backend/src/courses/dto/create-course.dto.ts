import { ApiProperty } from "@nestjs/swagger";
import { CefrLevel, CourseCategory } from "@prisma/client";
import { Transform } from "class-transformer";
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";
import { trimString } from "../../common/transforms/trim.transform";

export class CreateCourseDto {
  @ApiProperty({
    example: "Beginner English Grammar",
    minLength: 5,
    maxLength: 120,
  })
  @IsString()
  @MinLength(5)
  @MaxLength(120)
  @Transform(trimString)
  title: string;

  @ApiProperty({
    example: "A comprehensive course covering basic grammar rules...",
    minLength: 20,
    maxLength: 5000,
  })
  @IsString()
  @MinLength(20)
  @MaxLength(5000)
  description: string;

  @ApiProperty({ enum: CefrLevel, required: false })
  @IsOptional()
  @IsEnum(CefrLevel)
  level?: CefrLevel;

  @ApiProperty({ enum: CourseCategory, example: "GRAMMAR" })
  @IsEnum(CourseCategory)
  category: CourseCategory;

  @ApiProperty({
    required: false,
    example: "https://files.skilleng.com/covers/abc.jpg",
  })
  @IsOptional()
  @IsString()
  coverImageUrl?: string;
}
