import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsObject,
  IsUUID,
  ValidateNested,
} from "class-validator";

export class ExamAnswerItem {
  @ApiProperty({ description: "ID вопроса экзамена" })
  @IsUUID()
  questionId: string;

  @ApiProperty({ description: "Ответ в форме соответствующего типа вопроса" })
  @IsObject()
  answer: Record<string, unknown>;
}

export class SubmitExamDto {
  @ApiProperty({ type: [ExamAnswerItem] })
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => ExamAnswerItem)
  answers: ExamAnswerItem[];
}
