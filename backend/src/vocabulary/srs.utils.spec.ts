import { MIN_EASE_FACTOR, sm2Step, SrsState } from "./srs.utils";

const NOW = new Date("2026-06-12T12:00:00Z");

const fresh = (): SrsState => ({
  repetitions: 0,
  easeFactor: 2.5,
  intervalDays: 0,
});

function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / 86_400_000);
}

describe("sm2Step", () => {
  it("первый успешный повтор → интервал 1 день", () => {
    const r = sm2Step(4, fresh(), NOW);
    expect(r.intervalDays).toBe(1);
    expect(r.repetitions).toBe(1);
    expect(daysBetween(NOW, r.dueAt)).toBe(1);
  });

  it("второй успешный повтор → интервал 6 дней", () => {
    const r1 = sm2Step(4, fresh(), NOW);
    const r2 = sm2Step(4, r1, NOW);
    expect(r2.intervalDays).toBe(6);
    expect(r2.repetitions).toBe(2);
  });

  it("третий и далее → интервал растёт через easeFactor", () => {
    let s = sm2Step(4, fresh(), NOW); // 1 день
    s = sm2Step(4, s, NOW); // 6 дней
    const ef = s.easeFactor;
    const r3 = sm2Step(4, s, NOW);
    expect(r3.intervalDays).toBe(Math.round(6 * ef));
    expect(r3.repetitions).toBe(3);
  });

  it("quality < 3 → сброс repetitions и интервал 1 день", () => {
    let s = sm2Step(5, fresh(), NOW);
    s = sm2Step(5, s, NOW);
    s = sm2Step(5, s, NOW);
    expect(s.repetitions).toBe(3);

    const failed = sm2Step(2, s, NOW);
    expect(failed.repetitions).toBe(0);
    expect(failed.intervalDays).toBe(1);
    expect(daysBetween(NOW, failed.dueAt)).toBe(1);
    // easeFactor при провале НЕ меняется (классический SM-2)
    expect(failed.easeFactor).toBe(s.easeFactor);
  });

  it("quality=5 повышает easeFactor, quality=3 понижает", () => {
    const up = sm2Step(5, fresh(), NOW);
    expect(up.easeFactor).toBeCloseTo(2.6, 5);

    const down = sm2Step(3, fresh(), NOW);
    expect(down.easeFactor).toBeCloseTo(2.36, 5);

    const neutral = sm2Step(4, fresh(), NOW);
    expect(neutral.easeFactor).toBeCloseTo(2.5, 5);
  });

  it("easeFactor не опускается ниже 1.3", () => {
    let s: SrsState = { repetitions: 0, easeFactor: 1.32, intervalDays: 0 };
    for (let i = 0; i < 10; i++) {
      s = sm2Step(3, s, NOW);
    }
    expect(s.easeFactor).toBe(MIN_EASE_FACTOR);
  });

  it("длинная серия успехов: интервалы монотонно растут", () => {
    let s = sm2Step(4, fresh(), NOW);
    let prev = s.intervalDays;
    for (let i = 0; i < 8; i++) {
      s = sm2Step(4, s, NOW);
      expect(s.intervalDays).toBeGreaterThanOrEqual(prev);
      prev = s.intervalDays;
    }
    expect(s.intervalDays).toBeGreaterThan(30);
  });

  it.each([0, 1, 2])("граничный провал quality=%i ведёт к сбросу", (q) => {
    const s = sm2Step(q, { repetitions: 5, easeFactor: 2.0, intervalDays: 40 }, NOW);
    expect(s.repetitions).toBe(0);
    expect(s.intervalDays).toBe(1);
  });

  it("невалидный quality → RangeError", () => {
    expect(() => sm2Step(-1, fresh(), NOW)).toThrow(RangeError);
    expect(() => sm2Step(6, fresh(), NOW)).toThrow(RangeError);
    expect(() => sm2Step(3.5, fresh(), NOW)).toThrow(RangeError);
  });
});
