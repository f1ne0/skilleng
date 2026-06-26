import { ApiProperty } from "@nestjs/swagger";
import { IsInt, Max, Min } from "class-validator";

export class ReviewEntryDto {
  @ApiProperty({
    description:
      "Самооценка вспоминания по SM-2: 0-2 = забыл, 3-5 = вспомнил (5 = легко)",
    minimum: 0,
    maximum: 5,
    example: 4,
  })
  @IsInt()
  @Min(0)
  @Max(5)
  quality: number;
}
