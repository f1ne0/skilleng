import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsUUID, MaxLength, MinLength } from "class-validator";

export class LiveFeedbackDto {
  @ApiProperty({ description: "ID вопроса типа SHORT_WRITING" })
  @IsUUID()
  questionId: string;

  @ApiProperty({ description: "Текущий черновик ответа" })
  @IsString()
  @MinLength(10)
  @MaxLength(10_000)
  draft: string;
}
