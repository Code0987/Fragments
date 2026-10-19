import { BASE_SPEED } from "./layout";
import type { ObstacleKind } from "./types";

/** SpikeBoth scores 0.7. Every other tag scores 1.1. Both scale by speed / 6.6. */
export function clearedScore(speed: number, kind: ObstacleKind): number {
  const multiplier = kind === 3 ? 0.7 : 1.1;
  return (speed / BASE_SPEED) * multiplier;
}

export function shownScore(score: number): number {
  return Math.trunc(score);
}
