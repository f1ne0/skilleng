export interface LevelInfo {
  level: number;
  xpInCurrentLevel: number;
  xpForNextLevel: number;
  progress: number; // 0..1
}

// Формула: на каждый уровень нужно (100 + (level - 1) * 50) XP
// Уровень 1: 0-99 XP (100 нужно для апа)
// Уровень 2: 100-249 XP (150 нужно)
// Уровень 3: 250-449 XP (200 нужно)
// и так далее — растёт линейно, не экспоненциально.
// Это даёт быстрый рост на старте и более плавный позже.

function xpRequiredForLevel(level: number): number {
  return 100 + (level - 1) * 50;
}

export function getLevelInfo(totalXp: number): LevelInfo {
  let level = 1;
  let xpRemaining = totalXp;
  let required = xpRequiredForLevel(level);

  while (xpRemaining >= required) {
    xpRemaining -= required;
    level++;
    required = xpRequiredForLevel(level);
  }

  return {
    level,
    xpInCurrentLevel: xpRemaining,
    xpForNextLevel: required,
    progress: required > 0 ? xpRemaining / required : 0,
  };
}
