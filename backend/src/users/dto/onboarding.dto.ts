import { ApiProperty } from "@nestjs/swagger";
import { CefrLevel, LearningGoal } from "@prisma/client";
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export class OnboardingDto {
  @ApiProperty({ enum: CefrLevel, example: "B1" })
  @IsEnum(CefrLevel)
  level: CefrLevel;

  @ApiProperty({ enum: LearningGoal, example: "BUSINESS" })
  @IsEnum(LearningGoal)
  goal: LearningGoal;

  @ApiProperty({ required: false, example: "Uzbek" })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  nativeLanguage?: string;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  interests?: string[];
}
