import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from "class-validator";

export class CreateVocabularyEntryDto {
  @ApiProperty({ example: "apprehensive" })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  term: string;

  @ApiProperty({ example: "опасающийся, встревоженный" })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  translation: string;

  @ApiPropertyOptional({ example: "She was apprehensive about the exam." })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  example?: string;

  @ApiPropertyOptional({ example: "adjective" })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  partOfSpeech?: string;

  @ApiPropertyOptional({ description: "Урок, из которого добавлено слово" })
  @IsOptional()
  @IsUUID()
  sourceLessonId?: string;
}
