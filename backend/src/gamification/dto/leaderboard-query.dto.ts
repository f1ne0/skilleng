import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from "class-validator";

export class LeaderboardQueryDto {
  @ApiProperty({ enum: ["all", "week"], required: false, default: "all" })
  @IsOptional()
  @IsEnum(["all", "week"])
  period?: "all" | "week" = "all";

  @ApiProperty({ required: false, default: 100, minimum: 10, maximum: 500 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(10)
  @Max(500)
  limit?: number = 100;

  @ApiPropertyOptional({ description: "Whose rank to pin if outside the top" })
  @IsOptional()
  @IsUUID()
  userId?: string;
}
