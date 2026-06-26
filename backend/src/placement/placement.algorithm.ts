// Адаптивный алгоритм входного теста (CAT на упрощённой IRT / Elo-подобный шаг).
// Чистые функции: юнит-тестируемы и напрямую описываются в методической главе.
//
// Шкала ability (theta): -3..+3. Старт 0 ≈ середина B1.
// Маппинг theta → CEFR см. abilityToCefr.

import { CefrLevel } from "@prisma/client";

export const ABILITY_MIN = -3;
export const ABILITY_MAX = 3;
/** Жёсткий потолок длины теста */
export const MAX_QUESTIONS = 15;
/** Минимум вопросов до возможной ранней остановки */
export const MIN_QUESTIONS_FOR_CONVERGENCE = 8;
/** Сходимость: |изменение ability| на шаге меньше порога */
export const CONVERGENCE_THRESHOLD = 0.05;

/**
 * Обновление ability после ответа (Elo-подобный шаг IRT-lite).
 * K убывает с числом заданных вопросов — ранние ответы двигают оценку
 * сильнее, поздние уточняют. weight растёт при близости сложности
 * вопроса к текущей оценке (близкие вопросы информативнее).
 *
 * @returns новое ability (клампится в [-3, 3])
 */
export function updateAbility(
  ability: number,
  questionsAsked: number,
  itemDifficulty: number,
  isCorrect: boolean,
): number {
  const k = 1.0 / Math.sqrt(questionsAsked + 1);
  const weight = 1 / (1 + Math.abs(itemDifficulty - ability));
  const next = ability + k * (isCorrect ? 1 : -1) * weight;
  return Math.max(ABILITY_MIN, Math.min(ABILITY_MAX, next));
}

export interface SelectableItem {
  id: string;
  difficulty: number;
}

/**
 * Выбор следующего вопроса: ближайший по сложности к текущему ability
 * из ещё не заданных. Возвращает null, если банк исчерпан.
 */
export function selectNextItem<T extends SelectableItem>(
  ability: number,
  items: T[],
  askedIds: ReadonlySet<string>,
): T | null {
  let best: T | null = null;
  let bestDist = Infinity;

  for (const item of items) {
    if (askedIds.has(item.id)) continue;
    const dist = Math.abs(item.difficulty - ability);
    if (dist < bestDist) {
      best = item;
      bestDist = dist;
    }
  }

  return best;
}

/**
 * Остановка: достигнут лимит вопросов ИЛИ оценка сошлась
 * (после минимума вопросов изменение ability на последнем шаге < порога).
 */
export function shouldStop(
  questionsAsked: number,
  lastAbilityDelta: number,
): boolean {
  if (questionsAsked >= MAX_QUESTIONS) return true;
  return (
    questionsAsked >= MIN_QUESTIONS_FOR_CONVERGENCE &&
    Math.abs(lastAbilityDelta) < CONVERGENCE_THRESHOLD
  );
}

/**
 * Маппинг финального ability → CEFR.
 * Границы выбраны так, чтобы старт (0) лежал в середине B1.
 */
export function abilityToCefr(ability: number): CefrLevel {
  if (ability < -2) return CefrLevel.A1;
  if (ability < -1) return CefrLevel.A2;
  if (ability < 0.5) return CefrLevel.B1;
  if (ability < 1.5) return CefrLevel.B2;
  if (ability < 2.5) return CefrLevel.C1;
  return CefrLevel.C2;
}

/** Центр уровня по шкале theta — для калибровки банка при seed */
export const LEVEL_DIFFICULTY_CENTER: Record<CefrLevel, number> = {
  A1: -2.5,
  A2: -1.5,
  B1: -0.25,
  B2: 1.0,
  C1: 2.0,
  C2: 2.75,
};
