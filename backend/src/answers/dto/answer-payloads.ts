import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";

// ===== Структура ответа для каждого типа вопроса =====

// MULTIPLE_CHOICE — индекс выбранного варианта
export class MultipleChoiceAnswer {
  @IsInt()
  @Min(0)
  selectedIndex: number;
}

// FILL_BLANK — текст ответа
export class FillBlankAnswer {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  answer: string;
}

// DRAG_DROP — слова в порядке, как студент их разложил
export class DragDropAnswer {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @IsString({ each: true })
  orderedWords: string[];
}

// MATCH_PAIRS — список сопоставлений
class MatchPairAnswer {
  @IsString()
  @MinLength(1)
  left: string;

  @IsString()
  @MinLength(1)
  right: string;
}

export class MatchPairsAnswer {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => MatchPairAnswer)
  matches: MatchPairAnswer[];
}

// SHORT_WRITING — открытый текст
export class ShortWritingAnswer {
  @IsString()
  @MinLength(1)
  @MaxLength(10_000)
  text: string;
}

// SPEAKING_RESPONSE — URL загруженной записи (R2, purpose SPEAKING_RESPONSE)
export class SpeakingAnswer {
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  audioUrl: string;
}
