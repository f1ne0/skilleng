import { BadRequestException } from "@nestjs/common";
import { QuestionType } from "@prisma/client";
import { ClassConstructor, plainToInstance } from "class-transformer";
import { validate } from "class-validator";

import {
  DragDropPayload,
  FillBlankPayload,
  MatchPairsPayload,
  MultipleChoicePayload,
} from "../questions/dto/payloads";
import {
  DragDropAnswer,
  FillBlankAnswer,
  MatchPairsAnswer,
  MultipleChoiceAnswer,
  ShortWritingAnswer,
  SpeakingAnswer,
} from "./dto/answer-payloads";

// ===== Валидация формы ответа =====
// Каждый тип вопроса ждёт определённую форму ответа.
// Если форма не сходится — 400.

function getAnswerClass(type: QuestionType): ClassConstructor<object> {
  switch (type) {
    case QuestionType.MULTIPLE_CHOICE:
      return MultipleChoiceAnswer;
    case QuestionType.FILL_BLANK:
      return FillBlankAnswer;
    case QuestionType.DRAG_DROP:
      return DragDropAnswer;
    case QuestionType.MATCH_PAIRS:
      return MatchPairsAnswer;
    case QuestionType.SHORT_WRITING:
      return ShortWritingAnswer;
    case QuestionType.SPEAKING_RESPONSE:
      return SpeakingAnswer;
  }
}

export async function validateAnswerShape(
  type: QuestionType,
  answer: unknown,
): Promise<Record<string, unknown>> {
  const AnswerClass = getAnswerClass(type);
  const instance = plainToInstance(AnswerClass, answer);
  const errors = await validate(instance, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });

  if (errors.length > 0) {
    const messages = errors.flatMap((e) => Object.values(e.constraints ?? {}));
    throw new BadRequestException({
      message: `Invalid answer shape for ${type}`,
      details: messages,
    });
  }

  return JSON.parse(JSON.stringify(instance)) as Record<string, unknown>;
}

// ===== Проверка правильности ответа =====
// КЛЮЧЕВАЯ функция: вернёт true только если студент ответил корректно.
// Логика для каждого типа разная.

export function checkAnswerCorrectness(
  type: QuestionType,
  questionPayload: unknown,
  studentAnswer: unknown,
): boolean | null {
  // null = "не могу определить" (например SHORT_WRITING, нужен AI)
  switch (type) {
    case QuestionType.MULTIPLE_CHOICE: {
      const p = questionPayload as MultipleChoicePayload;
      const a = studentAnswer as MultipleChoiceAnswer;
      return a.selectedIndex === p.correctIndex;
    }

    case QuestionType.FILL_BLANK: {
      const p = questionPayload as FillBlankPayload;
      const a = studentAnswer as FillBlankAnswer;

      const submitted = a.answer.trim();
      const submittedCmp = p.caseSensitive
        ? submitted
        : submitted.toLowerCase();
      const correctList = p.caseSensitive
        ? p.correctAnswers
        : p.correctAnswers.map((s) => s.toLowerCase());

      return correctList.includes(submittedCmp);
    }

    case QuestionType.DRAG_DROP: {
      const p = questionPayload as DragDropPayload;
      const a = studentAnswer as DragDropAnswer;

      if (a.orderedWords.length !== p.words.length) return false;
      return a.orderedWords.every((word, i) => word === p.words[i]);
    }

    case QuestionType.MATCH_PAIRS: {
      const p = questionPayload as MatchPairsPayload;
      const a = studentAnswer as MatchPairsAnswer;

      if (a.matches.length !== p.pairs.length) return false;

      // Строим Map правильных пар, затем проверяем что каждый match попал в карту
      const correctMap = new Map(
        p.pairs.map((pair) => [pair.left, pair.right]),
      );
      return a.matches.every((m) => correctMap.get(m.left) === m.right);
    }

    case QuestionType.SHORT_WRITING: {
      // Без AI правильность определить нельзя.
      // В Шаге 10 здесь будет вызов LLM для оценки по rubric.
      // Пока: сабмит принимается, но isCorrect = null → не считается ни правильным, ни неправильным.
      return null;
    }

    case QuestionType.SPEAKING_RESPONSE: {
      // Устный ответ оценивает AI асинхронно (evaluateSpeakingAsync)
      return null;
    }

    default:
      return false;
  }
}

// ===== Получить правильный ответ для показа студенту =====
// Используется когда студент ответил неправильно — показываем как было правильно.

export function getCorrectAnswerView(
  type: QuestionType,
  payload: unknown,
): Record<string, unknown> | null {
  switch (type) {
    case QuestionType.MULTIPLE_CHOICE: {
      const p = payload as MultipleChoicePayload;
      return {
        correctIndex: p.correctIndex,
        correctOption: p.options[p.correctIndex],
      };
    }

    case QuestionType.FILL_BLANK: {
      const p = payload as FillBlankPayload;
      return { correctAnswers: p.correctAnswers };
    }

    case QuestionType.DRAG_DROP: {
      const p = payload as DragDropPayload;
      return { correctOrder: p.words };
    }

    case QuestionType.MATCH_PAIRS: {
      const p = payload as MatchPairsPayload;
      return { pairs: p.pairs };
    }

    case QuestionType.SHORT_WRITING:
      // Открытый ответ — нет одного "правильного"
      return null;

    case QuestionType.SPEAKING_RESPONSE:
      // Устный ответ — нет одного "правильного"
      return null;

    default:
      return null;
  }
}
