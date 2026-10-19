import { SMOOTH_TIME, TARGETS } from "./layout";
import { smoothDamp } from "./smooth-damp";
import type { InputType } from "./types";

export interface Player {
  left: number;
  right: number;
  prevLeft: number;
  prevRight: number;
  vLeft: number;
  vRight: number;
}

export function createPlayer(): Player {
  const rest = TARGETS.none;
  return {
    left: rest.left,
    right: rest.right,
    prevLeft: rest.left,
    prevRight: rest.right,
    vLeft: 0,
    vRight: 0,
  };
}

export function stepPlayer(player: Player, input: InputType, dt: number): void {
  const target = TARGETS[input];
  player.prevLeft = player.left;
  player.prevRight = player.right;
  const left = smoothDamp(player.left, target.left, player.vLeft, SMOOTH_TIME, dt);
  const right = smoothDamp(player.right, target.right, player.vRight, SMOOTH_TIME, dt);
  player.left = left.value;
  player.vLeft = left.velocity;
  player.right = right.value;
  player.vRight = right.velocity;
}

export function samplePlayer(player: Player, alpha: number): { left: number; right: number } {
  const t = Math.min(Math.max(alpha, 0), 1);
  return {
    left: player.prevLeft + (player.left - player.prevLeft) * t,
    right: player.prevRight + (player.right - player.prevRight) * t,
  };
}
