import { ApiProperty } from "@nestjs/swagger";
import { CefrLevel, CourseCategory } from "@prisma/client";
import { Type } from "class-transformer";
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";

export class CourseFilterDto {
  @ApiProperty({ required: false, enum: CefrLevel })
  @IsOptional()
  @IsEnum(CefrLevel)
  level?: CefrLevel;

  @ApiProperty({ required: false, enum: CourseCategory })
  @IsOptional()
  @IsEnum(CourseCategory)
  category?: CourseCategory;

  @ApiProperty({ required: false, example: "grammar" })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
  // поиск по title/description через case-insensitive contains

  @ApiProperty({ required: false, default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  // @Type — class-transformer: преобразовать строку query param в число.
  // Query params в HTTP всегда строки, поэтому без этого IsInt упадёт.
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ required: false, default: 12, minimum: 1, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  // максимум 50 за раз — защита от запроса "дай мне 100000 курсов"
  limit?: number = 12;
}
