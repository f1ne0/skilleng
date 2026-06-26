import { ApiProperty } from "@nestjs/swagger";
import { ArrayMinSize, ArrayNotEmpty, IsArray, IsUUID } from "class-validator";

export class ReorderLessonsDto {
  @ApiProperty({
    type: [String],
    example: ["uuid-1", "uuid-2", "uuid-3"],
    description: "Lesson IDs in desired order",
  })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMinSize(1)
  @IsUUID("4", { each: true })
  // each: проверка что КАЖДЫЙ элемент массива — валидный UUID v4
  lessonIds: string[];
}
