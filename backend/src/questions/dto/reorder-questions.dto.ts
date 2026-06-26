import { ApiProperty } from "@nestjs/swagger";
import { ArrayMinSize, ArrayNotEmpty, IsArray, IsUUID } from "class-validator";

export class ReorderQuestionsDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMinSize(1)
  @IsUUID("4", { each: true })
  questionIds: string[];
}
