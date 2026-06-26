import { CefrLevel } from "@prisma/client";

import {
  ABILITY_MAX,
  ABILITY_MIN,
  abilityToCefr,
  CONVERGENCE_THRESHOLD,
  MAX_QUESTIONS,
  MIN_QUESTIONS_FOR_CONVERGENCE,
  selectNextItem,
  shouldStop,
  updateAbility,
} from "./placement.algorithm";

describe("updateAbility", () => {
  it("правильный ответ повышает ability, неправильный — понижает", () => {
    expect(updateAbility(0, 0, 0, true)).toBeGreaterThan(0);
    expect(updateAbility(0, 0, 0, false)).toBeLessThan(0);
  });

  it("шаг K убывает с числом заданных вопросов", () => {
    const early = updateAbility(0, 0, 0, true);
    const late = updateAbility(0, 10, 0, true);
    expect(early).toBeGreaterThan(late);
  });

  it("далёкий по сложности вопрос двигает оценку слабее близкого", () => {
    const near = updateAbility(0, 3, 0, true);
    const far = updateAbility(0, 3, 3, true);
    expect(near).toBeGreaterThan(far);
  });

  it("ability клампится в [-3, 3]", () => {
    expect(updateAbility(2.95, 0, 3, true)).toBeLessThanOrEqual(ABILITY_MAX);
    expect(updateAbility(-2.95, 0, -3, false)).toBeGreaterThanOrEqual(
      ABILITY_MIN,
    );
  });

  it("серия правильных ответов монотонно растит оценку до потолка шкалы", () => {
    let ability = 0;
    for (let i = 0; i < 10; i++) {
      const next = updateAbility(ability, i, ability, true);
      // строго растёт, пока не упрётся в кламп +3
      if (ability < ABILITY_MAX) {
        expect(next).toBeGreaterThan(ability);
      } else {
        expect(next).toBe(ABILITY_MAX);
      }
      ability = next;
    }
    expect(ability).toBe(ABILITY_MAX);
  });
});

describe("selectNextItem", () => {
  const items = [
    { id: "a", difficulty: -2 },
    { id: "b", difficulty: 0 },
    { id: "c", difficulty: 1.5 },
  ];

  it("выбирает ближайший по сложности к ability", () => {
    expect(selectNextItem(0.2, items, new Set())?.id).toBe("b");
    expect(selectNextItem(2, items, new Set())?.id).toBe("c");
    expect(selectNextItem(-3, items, new Set())?.id).toBe("a");
  });

  it("пропускает уже заданные", () => {
    expect(selectNextItem(0, items, new Set(["b"]))?.id).toBe("c");
  });

  it("возвращает null на исчерпанном банке", () => {
    expect(selectNextItem(0, items, new Set(["a", "b", "c"]))).toBeNull();
  });
});

describe("shouldStop", () => {
  it("останавливается на лимите вопросов", () => {
    expect(shouldStop(MAX_QUESTIONS, 1)).toBe(true);
  });

  it("ранняя остановка при сходимости после минимума вопросов", () => {
    expect(
      shouldStop(MIN_QUESTIONS_FOR_CONVERGENCE, CONVERGENCE_THRESHOLD / 2),
    ).toBe(true);
  });

  it("НЕ останавливается рано до минимума вопросов даже при сходимости", () => {
    expect(shouldStop(MIN_QUESTIONS_FOR_CONVERGENCE - 1, 0)).toBe(false);
  });

  it("продолжает при большом изменении ability", () => {
    expect(shouldStop(MIN_QUESTIONS_FOR_CONVERGENCE, 0.5)).toBe(false);
  });
});

describe("abilityToCefr", () => {
  it.each<[number, CefrLevel]>([
    [-3, CefrLevel.A1],
    [-2.01, CefrLevel.A1],
    [-2, CefrLevel.A2],
    [-1.01, CefrLevel.A2],
    [-1, CefrLevel.B1],
    [0, CefrLevel.B1],
    [0.49, CefrLevel.B1],
    [0.5, CefrLevel.B2],
    [1.49, CefrLevel.B2],
    [1.5, CefrLevel.C1],
    [2.49, CefrLevel.C1],
    [2.5, CefrLevel.C2],
    [3, CefrLevel.C2],
  ])("theta=%f → %s", (theta, level) => {
    expect(abilityToCefr(theta)).toBe(level);
  });
});
