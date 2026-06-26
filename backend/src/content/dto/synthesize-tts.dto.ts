import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from "class-validator";

class TtsSpeakerDto {
  @ApiProperty({ example: "Anna", description: "Имя спикера в тексте диалога" })
  @IsString()
  @MinLength(1)
  @MaxLength(30)
  speaker: string;

  @ApiProperty({ example: "Kore", description: "Prebuilt-голос Gemini TTS" })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  voiceName: string;
}

export class SynthesizeTtsDto {
  @ApiProperty({
    description:
      "Текст для озвучки. Поддерживает аудио-теги Gemini ([cheerfully] и т.п.). " +
      "Для диалога строки должны начинаться с имени спикера: 'Anna: Hello!'",
  })
  @IsString()
  @MinLength(1)
  @MaxLength(8000)
  text: string;

  @ApiPropertyOptional({ example: "Kore", default: "Kore" })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  voice?: string;

  @ApiPropertyOptional({
    type: [TtsSpeakerDto],
    description: "Мультиспикер (до 2) для диалогов; voice игнорируется",
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(2)
  @ValidateNested({ each: true })
  @Type(() => TtsSpeakerDto)
  speakers?: TtsSpeakerDto[];
}
