import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsUUID } from "class-validator";

export class CreateConversationDto {
  @ApiProperty({
    required: false,
    description: "Optional lesson ID for lesson-context chat",
  })
  @IsOptional()
  @IsUUID("4")
  lessonId?: string;
}
