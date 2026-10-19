import { describe, expect, it } from "vitest";
import { BASE_SPEED } from "./layout";
import { clearedScore, shownScore } from "./score";

describe("score", () => {
  it("scores both-walls lower than every other obstacle", () => {
    expect(clearedScore(BASE_SPEED, 3)).toBeCloseTo(0.7);
    expect(clearedScore(BASE_SPEED, 1)).toBeCloseTo(1.1);
    expect(clearedScore(BASE_SPEED, 4)).toBeCloseTo(1.1);
    expect(clearedScore(BASE_SPEED, 5)).toBeCloseTo(1.1);
  });

  it("scales with speed over the base speed", () => {
    expect(clearedScore(BASE_SPEED * 2, 1)).toBeCloseTo(2.2);
    expect(clearedScore(BASE_SPEED * 2, 3)).toBeCloseTo(1.4);
  });

  it("shows the truncated integer", () => {
    expect(shownScore(0)).toBe(0);
    expect(shownScore(1.1)).toBe(1);
    expect(shownScore(3.999)).toBe(3);
  });
});
