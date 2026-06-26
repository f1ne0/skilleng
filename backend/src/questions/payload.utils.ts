import { BadRequestException } from "@nestjs/common";
import { QuestionType } from "@prisma/client";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";

import {
  DragDropPayload,
  FillBlankPayload,
  MatchPairsPayload,
  MultipleChoicePayload,
  ShortWritingPayload,
  SpeakingResponsePayload,
} from "./dto/payloads";

// Класс payload для каждого типа вопроса.
// Маппинг используется для динамической валидации.
const PAYLOAD_CLASSES = {
  MULTIPLE_CHOICE: MultipleChoicePayload,
  FILL_BLANK: FillBlankPayload,
  DRAG_DROP: DragDropPayload,
  MATCH_PAIRS: MatchPairsPayload,
  SHORT_WRITING: ShortWritingPayload,
  SPEAKING_RESPONSE: SpeakingResponsePayload,
} as const;

/**
 * Валидирует payload по типу вопроса.
 * Возвращает чистый объект с правильной формой или кидает 400.
 */
export async function validatePayloadByType(
  type: QuestionType,
  payload: unknown,
): Promise<Record<string, unknown>> {
  const PayloadClass = PAYLOAD_CLASSES[type];
  if (!PayloadClass) {
    throw new BadRequestException(`Unknown question type: ${type}`);
  }

  // plainToInstance преобразует обычный объект в инстанс класса,
  // что нужно для validate() — иначе декораторы не применятся.
  const instance = plainToInstance(
    PayloadClass as new () => PayloadOf<QuestionType>,
    payload,
  );
  const errors = await validate(instance, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });

  if (errors.length > 0) {
    const messages = errors.flatMap((e) => Object.values(e.constraints ?? {}));
    throw new BadRequestException({
      message: `Invalid payload for ${type}`,
      details: messages,
    });
  }

  // Дополнительные кросс-полевые проверки, которые class-validator не покрывает
  assertCrossFieldRules(type, instance);

  return instance as unknown as Record<string, unknown>;
}

/**
 * Проверки, которые требуют доступ к нескольким полям одновременно.
 * class-validator не умеет это удобно.
 */
type PayloadOf<T extends QuestionType> = T extends "MULTIPLE_CHOICE"
  ? MultipleChoicePayload
  : T extends "FILL_BLANK"
    ? FillBlankPayload
    : T extends "DRAG_DROP"
      ? DragDropPayload
      : T extends "MATCH_PAIRS"
        ? MatchPairsPayload
        : T extends "SHORT_WRITING"
          ? ShortWritingPayload
          : T extends "SPEAKING_RESPONSE"
            ? SpeakingResponsePayload
            : never;

function assertCrossFieldRules(
  type: QuestionType,
  payload: PayloadOf<QuestionType>,
): void {
  if (type === QuestionType.MULTIPLE_CHOICE) {
    const p = payload as MultipleChoicePayload;
    if (p.correctIndex >= p.options.length) {
      throw new BadRequestException(
        "correctIndex must be less than options.length",
      );
    }
  }

  if (type === QuestionType.FILL_BLANK) {
    const p = payload as FillBlankPayload;
    if (!p.text.includes("___")) {
      throw new BadRequestException(
        "FILL_BLANK text must contain ___ to mark the blank",
      );
    }
  }

  if (type === QuestionType.DRAG_DROP) {
    const p = payload as DragDropPayload;
    const unique = new Set(p.words);
    if (unique.size !== p.words.length) {
      throw new BadRequestException(
        "DRAG_DROP words must be unique (no duplicates allowed)",
      );
    }
  }

  if (type === QuestionType.MATCH_PAIRS) {
    const p = payload as MatchPairsPayload;
    const lefts = new Set(p.pairs.map((pair) => pair.left));
    const rights = new Set(p.pairs.map((pair) => pair.right));
    if (lefts.size !== p.pairs.length) {
      throw new BadRequestException(
        "MATCH_PAIRS: 'left' values must be unique",
      );
    }
    if (rights.size !== p.pairs.length) {
      throw new BadRequestException(
        "MATCH_PAIRS: 'right' values must be unique",
      );
    }
  }

  if (type === QuestionType.SHORT_WRITING) {
    const p = payload as ShortWritingPayload;
    if (p.minWords >= p.maxWords) {
      throw new BadRequestException("minWords must be less than maxWords");
    }
  }

  if (type === QuestionType.SPEAKING_RESPONSE) {
    const p = payload as SpeakingResponsePayload;
    if (
      p.minSeconds !== undefined &&
      p.maxSeconds !== undefined &&
      p.minSeconds >= p.maxSeconds
    ) {
      throw new BadRequestException("minSeconds must be less than maxSeconds");
    }
  }
}

/**
 * КРИТИЧЕСКАЯ ФУНКЦИЯ: преобразует payload в форму, видимую СТУДЕНТУ.
 * Удаляет правильные ответы. Перемешивает варианты.
 *
 * НИКОГДА не отдавать студенту "сырой" payload — там correctIndex,
 * correctAnswers и т.д. Атакующий откроет devtools и увидит ответы.
 */
export function toStudentView(
  type: QuestionType,
  payload: unknown,
): Record<string, unknown> {
  switch (type) {
    case QuestionType.MULTIPLE_CHOICE: {
      const p = payload as MultipleChoicePayload;
      // показываем варианты, но НЕ correctIndex
      return { options: p.options };
    }

    case QuestionType.FILL_BLANK: {
      const p = payload as FillBlankPayload;
      // показываем текст с пропуском, но НЕ correctAnswers
      return {
        text: p.text,
        caseSensitive: p.caseSensitive ?? false,
      };
    }

    case QuestionType.DRAG_DROP: {
      const p = payload as DragDropPayload;
      // перемешиваем слова — иначе студент сразу видит правильный порядок
      return { words: shuffleArray([...p.words]) };
    }

    case QuestionType.MATCH_PAIRS: {
      const p = payload as MatchPairsPayload;
      // разделяем пары: левая колонка остаётся, правая перемешивается
      return {
        lefts: p.pairs.map((pair) => pair.left),
        rights: shuffleArray(p.pairs.map((pair) => pair.right)),
      };
    }

    case QuestionType.SHORT_WRITING: {
      const p = payload as ShortWritingPayload;
      // тут скрывать нечего, всё показываем
      return {
        minWords: p.minWords,
        maxWords: p.maxWords,
        rubric: p.rubric,
      };
    }

    case QuestionType.SPEAKING_RESPONSE: {
      const p = payload as SpeakingResponsePayload;
      // expectedKeyPoints показываем: студент должен знать, о чём говорить
      return {
        expectedKeyPoints: p.expectedKeyPoints,
        minSeconds: p.minSeconds,
        maxSeconds: p.maxSeconds,
      };
    }

    default:
      return {};
  }
}

/**
 * Fisher-Yates shuffle. Простой и достаточный для UX.
 * Для криптографии не годится, но нам не для криптографии.
 */
function shuffleArray<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
