import { describe, expect, it } from "vitest";
import { TARGETS, hits } from "./layout";
import {
  alerts,
  createField,
  createQueue,
  isCenterFollowUp,
  pushId,
  rollId,
  spawnNext,
  stepField,
} from "./obstacles";
import type { InputType, ObstacleKind } from "./types";

describe("SpecialQueue", () => {
  it("bans a third identical spike and a second center spike", () => {
    const queue = createQueue();
    expect(alerts(queue, 1)).toBe(false);
    pushId(queue, 1);
    pushId(queue, 1);
    expect(alerts(queue, 1)).toBe(true);
    expect(alerts(queue, 2)).toBe(false);

    const center = createQueue();
    pushId(center, 4);
    expect(alerts(center, 4)).toBe(true);
    expect(alerts(center, 1)).toBe(false);
  });

  it("flags a center spike that follows a left or right spike", () => {
    const queue = createQueue();
    pushId(queue, 1);
    pushId(queue, 4);
    expect(isCenterFollowUp(queue)).toBe(true);

    pushId(queue, 3);
    pushId(queue, 4);
    expect(isCenterFollowUp(queue)).toBe(false);
  });

  it("retries a banned roll", () => {
    const queue = createQueue();
    pushId(queue, 1);
    pushId(queue, 1);
    const rolls = [0, 0.4];
    let i = 0;
    const id = rollId(queue, 5, () => rolls[i++]);
    expect(id).not.toBe(1);
    expect(queue.latest).toBe(id);
  });
});

describe("obstacle geometry", () => {
  const safe: Record<string, InputType> = {
    "1": "right",
    "2": "left",
    "3": "none",
    "4": "both",
    "5:0": "left",
    "5:1": "right",
    "5:2": "none",
  };
  const inputs: InputType[] = ["none", "left", "right", "both"];

  function cases(): Array<[ObstacleKind, number, string]> {
    return [
      [1, 0, "1"],
      [2, 0, "2"],
      [3, 0, "3"],
      [4, 0, "4"],
      [5, 0, "5:0"],
      [5, 1, "5:1"],
      [5, 2, "5:2"],
    ];
  }

  it("kills every stance except the one that fits the gap", () => {
    for (const [kind, variant, key] of cases()) {
      for (const input of inputs) {
        const pose = TARGETS[input];
        const dead = hits(pose.left, pose.right, kind, variant, 0);
        expect(dead, `${key} vs ${input}`).toBe(input !== safe[key]);
      }
    }
  });
});

describe("pool", () => {
  it("reuses a slot after the obstacle falls off", () => {
    const field = createField(() => 0);
    for (let i = 0; i < 25; i++) {
      spawnNext(field, 6.6, () => 0);
      for (const item of field.items) item.y = -100;
      stepField(field, 6.6, 0.02, () => 0, false, () => {});
    }
    expect(field.items.length).toBeLessThan(4);
    expect(field.items.some((item) => item.alive)).toBe(false);
  });

  it("waits longer before a center spike that follows a side spike", () => {
    const rolls = [0, 0.75];
    let i = 0;
    const rng = () => rolls[Math.min(i++, rolls.length - 1)];
    const field = createField(rng);
    expect(field.nextKind).toBe(1);
    spawnNext(field, 6.6, rng);
    expect(field.wait).toBeCloseTo((1.3 * 6.5) / 6.6);

    const plain = createField(() => 0);
    spawnNext(plain, 6.6, () => 0.5);
    expect(plain.wait).toBeCloseTo((1.1 * 6.5) / 6.6);
  });

  it("unlocks blocks only after 40 spawns", () => {
    const field = createField(() => 0.1);
    expect(field.maxExclusive).toBe(5);
    for (let i = 0; i < 39; i++) spawnNext(field, 6.6, () => 0.1);
    expect(field.maxExclusive).toBe(5);
    spawnNext(field, 6.6, () => 0.1);
    expect(field.generated).toBe(41);
    expect(field.maxExclusive).toBe(6);
    expect(field.items.length).toBeLessThan(45);
  });
});
