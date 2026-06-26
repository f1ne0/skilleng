import { ApiProperty } from "@nestjs/swagger";
import { IsObject } from "class-validator";

export class SubmitAnswerDto {
  @ApiProperty({
    description:
      "Answer payload, structure depends on question type. Validated server-side.",
    example: { selectedIndex: 0 },
  })
  @IsObject()
  answer: Record<string, unknown>;
}
