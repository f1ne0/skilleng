export interface StreakUpdate {
  newCurrentStreak: number;
  newLongestStreak: number;
  newLastActiveDate: Date;
  isNewDay: boolean;
  isStreakIncreased: boolean;
}

/**
 * Рассчитывает новое состояние стрика.
 * Чистая функция — без БД-вызовов, легко тестировать.
 */
export function calculateStreak(
  now: Date,
  lastActiveDate: Date | null,
  currentStreak: number,
  longestStreak: number,
): StreakUpdate {
  const today = startOfDay(now);

  // Если юзер вообще никогда не был активен — это первый день
  if (!lastActiveDate) {
    return {
      newCurrentStreak: 1,
      newLongestStreak: Math.max(longestStreak, 1),
      newLastActiveDate: today,
      isNewDay: true,
      isStreakIncreased: true,
    };
  }

  const lastDay = startOfDay(lastActiveDate);
  const dayDiff = daysBetween(lastDay, today);

  if (dayDiff === 0) {
    // Уже была активность сегодня — ничего не меняем
    return {
      newCurrentStreak: currentStreak,
      newLongestStreak: longestStreak,
      newLastActiveDate: lastActiveDate,
      isNewDay: false,
      isStreakIncreased: false,
    };
  }

  if (dayDiff === 1) {
    // Был активен вчера → стрик продолжается
    const newStreak = currentStreak + 1;
    return {
      newCurrentStreak: newStreak,
      newLongestStreak: Math.max(longestStreak, newStreak),
      newLastActiveDate: today,
      isNewDay: true,
      isStreakIncreased: true,
    };
  }

  // dayDiff > 1 → пропустил день/дни → стрик сбрасывается, начинается с 1
  return {
    newCurrentStreak: 1,
    newLongestStreak: longestStreak,
    // longest не сбрасываем — это исторический максимум
    newLastActiveDate: today,
    isNewDay: true,
    isStreakIncreased: false,
    // флаг false потому что СТРИК прервался (хотя текущий стал 1)
  };
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  // По UTC — единый стандарт для всех юзеров.
  // Иначе студент в Ташкенте и в Лондоне получили бы разные "дни".
  return d;
}

function daysBetween(start: Date, end: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((end.getTime() - start.getTime()) / msPerDay);
}
