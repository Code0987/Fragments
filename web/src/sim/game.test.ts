import { describe, expect, it } from "vitest";
import { createGame, startRun, step } from "./game";
import { FIXED_DT, TARGETS } from "./layout";
import type { InputType, ObstacleKind } from "./types";

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function answer(kind: ObstacleKind): InputType {
  if (kind === 1) return "right";
  if (kind === 2) return "left";
  if (kind === 4) return "both";
  return "none";
}

describe("game", () => {
  it("ramps speed by one seventh per second while the run is alive", () => {
    const game = createGame(0, () => 0);
    startRun(game);
    for (let i = 0; i < 50; i++) step(game, "right", FIXED_DT);
    expect(game.phase).toBe("playing");
    expect(game.speed).toBeCloseTo(6.6 + 1 / 7, 5);
  });

  it("dies if the pair stays centered under a left spike", () => {
    const game = createGame(0, () => 0);
    startRun(game);
    for (let i = 0; i < 50 * 4; i++) step(game, "none", FIXED_DT);
    expect(game.phase).toBe("dead");
    expect(game.score).toBe(0);
  });

  it("survives a scripted minute and scores cleared obstacles", () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const game = createGame(3, mulberry32(seed));
      startRun(game);
      let input: InputType = "none";
      for (let i = 0; i < 50 * 45; i++) {
        const threat = game.field.items
          .filter((item) => item.alive && !item.scored)
          .sort((a, b) => a.y - b.y)[0];
        if (threat) input = answer(threat.kind);
        step(game, input, FIXED_DT);
        if (game.phase !== "playing") break;
      }
      expect(game.phase, `seed ${seed} score ${game.score}`).toBe("playing");
      expect(game.score, `seed ${seed}`).toBeGreaterThan(10);
      expect(game.highScore).toBe(Math.trunc(game.score));
      expect(game.field.items.length).toBeLessThan(12);
    }
  });

  it("resets the score and brings the pieces back on the next run", () => {
    const game = createGame(0, () => 0);
    startRun(game);
    for (let i = 0; i < 50 * 4; i++) step(game, "none", FIXED_DT);
    expect(game.phase).toBe("dead");
    startRun(game);
    expect(game.phase).toBe("playing");
    expect(game.score).toBe(0);
    expect(game.speed).toBeCloseTo(6.6);
    expect(game.player.left).toBeCloseTo(TARGETS.none.left);
    expect(game.player.right).toBeCloseTo(TARGETS.none.right);
  });
});
