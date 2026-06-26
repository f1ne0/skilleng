import { ApiPropertyOptional, OmitType, PartialType } from "@nestjs/swagger";
import { IsOptional, IsUUID, ValidateIf } from "class-validator";

import { CreateLessonDto } from "./create-lesson.dto";

// Берём все поля Create, кроме topicId — его переопределяем, чтобы разрешить null (отвязка от темы)
export class UpdateLessonDto extends PartialType(
  OmitType(CreateLessonDto, ["topicId"] as const),
) {
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsUUID()
  topicId?: string | null;
}
