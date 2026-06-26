import { ApiProperty } from "@nestjs/swagger";
import { IsObject, IsUUID } from "class-validator";

export class AnswerPlacementDto {
  @ApiProperty({ description: "ID выданного вопроса (из ответа start/answer)" })
  @IsUUID()
  itemId: string;

  @ApiProperty({
    description: "Ответ в форме соответствующего типа вопроса",
    example: { selectedIndex: 2 },
  })
  @IsObject()
  answer: Record<string, unknown>;
}
