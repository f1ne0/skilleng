import { ApiProperty } from "@nestjs/swagger";
import { Skill } from "@prisma/client";
import { Transform } from "class-transformer";
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from "class-validator";
import { trimString } from "../../common/transforms/trim.transform";

export class CreateLessonDto {
  @ApiProperty({ example: "Present Simple — be" })
  @IsString()
  @MinLength(3)
  @MaxLength(150)
  @Transform(trimString)
  title: string;

  @ApiProperty({ required: false, maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ example: "# Present Simple\n\nThe verb **be** is used..." })
  @IsString()
  @MinLength(10)
  @MaxLength(50_000)
  content: string;
  // 50K символов — хватит на длинный урок с примерами

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  videoUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  audioUrl?: string;

  @ApiProperty({ required: false, minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  durationSec?: number;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  isPreview?: boolean;

  @ApiProperty({ required: false, enum: Skill })
  @IsOptional()
  @IsEnum(Skill)
  skillFocus?: Skill;
  // вид речевой деятельности — для навыковых хабов

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  topicId?: string;
  // тема-справочник, тренажёром которой служит урок (Блок 6)

  @ApiProperty({
    required: false,
    nullable: true,
    description:
      "Дата открытия урока (ISO). null/прошлое — открыт, будущее — закрыт до даты.",
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsDateString()
  availableFrom?: string | null;
}
