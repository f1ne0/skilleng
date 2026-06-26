import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

// ===== MULTIPLE_CHOICE =====
// { options: ["Paris", "London", "Berlin"], correctIndex: 0 }
export class MultipleChoicePayload {
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(8)
  @IsString({ each: true })
  @MinLength(1, { each: true })
  @MaxLength(200, { each: true })
  options: string[];

  @IsInt()
  @Min(0)
  correctIndex: number;
}

// ===== FILL_BLANK =====
// { text: "I ___ to school every day.", correctAnswers: ["go", "walk"], caseSensitive: false }
export class FillBlankPayload {
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  text: string;
  // ___ (три подчёркивания) обозначают пропуск. Можно несколько ___ — но
  // для MVP считаем только один пропуск на вопрос.

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @IsString({ each: true })
  correctAnswers: string[];
  // несколько вариантов правильного ответа (например "go" и "walk")

  @IsBoolean()
  @IsOptional()
  caseSensitive?: boolean;
}

// ===== DRAG_DROP =====
// { words: ["I'm", "going", "to", "school"] }
// Студенту показываем перемешанные. Слова должны быть уникальными.
export class DragDropPayload {
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MinLength(1, { each: true })
  words: string[];
  // слова в ПРАВИЛЬНОМ порядке. Сервис их перемешает перед отправкой студенту.
}

// ===== MATCH_PAIRS =====
// { pairs: [{ left: "cat", right: "кот" }, { left: "dog", right: "собака" }] }
class MatchPair {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  left: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  right: string;
}

export class MatchPairsPayload {
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => MatchPair)
  pairs: MatchPair[];
}

// ===== SPEAKING_RESPONSE =====
// { expectedKeyPoints: ["greeting", "ordering food"], minSeconds: 20, maxSeconds: 120 }
// Текст задания — в Question.prompt (как у всех типов).
export class SpeakingResponsePayload {
  @IsArray()
  @IsOptional()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @MaxLength(200, { each: true })
  expectedKeyPoints?: string[];
  // что должно прозвучать в ответе — опора для AI-оценки

  @IsInt()
  @IsOptional()
  @Min(5)
  @Max(600)
  minSeconds?: number;

  @IsInt()
  @IsOptional()
  @Min(5)
  @Max(600)
  maxSeconds?: number;
}

// ===== SHORT_WRITING =====
// { minWords: 50, maxWords: 200, rubric: "Argue your position on..." }
export class ShortWritingPayload {
  @IsInt()
  @Min(1)
  @Max(500)
  minWords: number;

  @IsInt()
  @Min(1)
  @Max(1000)
  maxWords: number;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  rubric?: string;
  // критерии для AI-оценки (используется в Шаге 10)
}
