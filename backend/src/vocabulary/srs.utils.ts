// SM-2 (SuperMemo-2) — алгоритм интервального повтора.
// Чистая функция: легко юнит-тестируется, и её поведение можно
// напрямую описать в методической главе (spacing effect, кривая Эббингауза).

export interface SrsState {
  repetitions: number;
  easeFactor: number;
  intervalDays: number;
}

export interface SrsResult extends SrsState {
  dueAt: Date;
}

export const MIN_EASE_FACTOR = 1.3;
export const MIN_QUALITY = 0;
export const MAX_QUALITY = 5;

/**
 * Один шаг SM-2.
 * @param quality 0-5 — самооценка вспоминания (0-2 = забыл, 3-5 = вспомнил)
 * @param state   текущее SRS-состояние записи
 * @param now     "сейчас" (инжектится для тестируемости)
 */
export function sm2Step(
  quality: number,
  state: SrsState,
  now: Date = new Date(),
): SrsResult {
  if (
    !Number.isInteger(quality) ||
    quality < MIN_QUALITY ||
    quality > MAX_QUALITY
  ) {
    throw new RangeError(`quality must be an integer ${MIN_QUALITY}-${MAX_QUALITY}, got ${quality}`);
  }

  let { repetitions, easeFactor, intervalDays } = state;

  if (quality < 3) {
    // Забыл — сброс прогресса, слово вернётся завтра
    repetitions = 0;
    intervalDays = 1;
  } else {
    // Вспомнил — интервал растёт
    if (repetitions === 0) {
      intervalDays = 1;
    } else if (repetitions === 1) {
      intervalDays = 6;
    } else {
      intervalDays = Math.round(intervalDays * easeFactor);
    }

    // Коэффициент лёгкости: растёт при quality=5, падает при 3
    easeFactor +=
      0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
    if (easeFactor < MIN_EASE_FACTOR) easeFactor = MIN_EASE_FACTOR;

    repetitions += 1;
  }

  const dueAt = new Date(now);
  dueAt.setDate(dueAt.getDate() + intervalDays);

  return { repetitions, easeFactor, intervalDays, dueAt };
}
