import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { CefrLevel, TopicSkill } from "@prisma/client";
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

export class CreateTopicDto {
  @ApiProperty({ example: "Present Perfect vs Past Simple" })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title: string;

  @ApiProperty({ enum: TopicSkill, example: "GRAMMAR" })
  @IsEnum(TopicSkill)
  skill: TopicSkill;

  @ApiProperty({ enum: CefrLevel, example: "B1" })
  @IsEnum(CefrLevel)
  level: CefrLevel;

  @ApiProperty({ description: "Markdown-справочник: правило, объяснение, примеры" })
  @IsString()
  @MinLength(10)
  @MaxLength(50_000)
  theoryContent: string;

  @ApiPropertyOptional({ default: 0, description: "Позиция внутри (skill, level)" })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number = 0;
}
