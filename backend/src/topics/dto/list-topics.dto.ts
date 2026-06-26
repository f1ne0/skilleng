import { ApiPropertyOptional } from "@nestjs/swagger";
import { CefrLevel, TopicSkill } from "@prisma/client";
import { IsEnum, IsOptional } from "class-validator";

export class ListTopicsDto {
  @ApiPropertyOptional({ enum: TopicSkill })
  @IsOptional()
  @IsEnum(TopicSkill)
  skill?: TopicSkill;

  @ApiPropertyOptional({ enum: CefrLevel })
  @IsOptional()
  @IsEnum(CefrLevel)
  level?: CefrLevel;
}
