import { ApiProperty } from "@nestjs/swagger";
import { CefrLevel } from "@prisma/client";
import { IsEnum, IsString, MaxLength, MinLength } from "class-validator";

export class GenerateLessonDto {
  @ApiProperty({ example: "Present Simple — daily routines" })
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  topic: string;

  @ApiProperty({ enum: CefrLevel, example: "B1" })
  @IsEnum(CefrLevel)
  level: CefrLevel;
}
