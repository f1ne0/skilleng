import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsInt, IsOptional, Max, Min } from "class-validator";

export class SeedBankDto {
  @ApiPropertyOptional({
    description: "Сколько вопросов сгенерировать на каждый CEFR-уровень",
    minimum: 1,
    maximum: 10,
    default: 5,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  perLevel?: number = 5;
}
