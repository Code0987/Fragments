import { describe, expect, it } from "vitest";
import { SMOOTH_TIME } from "./layout";
import { smoothDamp } from "./smooth-damp";

describe("smoothDamp", () => {
  it("approaches the target from rest without passing it", () => {
    let value = 0;
    let velocity = 0;
    for (let i = 0; i < 120; i++) {
      const next = smoothDamp(value, 3.2, velocity, SMOOTH_TIME, 1 / 50);
      expect(next.value).toBeGreaterThanOrEqual(value - 1e-6);
      expect(next.value).toBeLessThanOrEqual(3.2 + 1e-4);
      value = next.value;
      velocity = next.velocity;
    }
    expect(value).toBeCloseTo(3.2, 2);
  });

  it("settles from the split stance back to center", () => {
    let value = 3.2;
    let velocity = 0;
    for (let i = 0; i < 150; i++) {
      const next = smoothDamp(value, 0.48, velocity, SMOOTH_TIME, 1 / 50);
      expect(next.value).toBeLessThanOrEqual(value + 1e-6);
      expect(next.value).toBeGreaterThanOrEqual(0.48 - 1e-4);
      value = next.value;
      velocity = next.velocity;
    }
    expect(value).toBeCloseTo(0.48, 2);
  });
});
