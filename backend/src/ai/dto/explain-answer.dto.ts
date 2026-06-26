import { ApiProperty } from "@nestjs/swagger";
import { IsObject, IsUUID } from "class-validator";

export class ExplainAnswerDto {
  @ApiProperty()
  @IsUUID("4")
  questionId: string;

  @ApiProperty({ description: "The student's incorrect answer" })
  @IsObject()
  studentAnswer: Record<string, unknown>;
}
