import { ApiProperty } from "@nestjs/swagger";
import { CefrLevel, LearningGoal } from "@prisma/client";
import { Transform } from "class-transformer";
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";
import { trimString } from "../../common/transforms/trim.transform";

export class UpdateProfileDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(trimString)
  firstName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(trimString)
  lastName?: string;

  @ApiProperty({ required: false, enum: CefrLevel })
  @IsOptional()
  @IsEnum(CefrLevel)
  level?: CefrLevel;

  @ApiProperty({ required: false, enum: LearningGoal })
  @IsOptional()
  @IsEnum(LearningGoal)
  goal?: LearningGoal;

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

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  bio?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  avatarUrl?: string;
}
