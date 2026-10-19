import type { InputType, ObstacleKind } from "./types";

/** Unity GameManager.SPEED. Ratios in score and spawn timing use this, not the live speed. */
export const BASE_SPEED = 6.6;

/** Unity default FixedUpdate step. */
export const FIXED_DT = 1 / 50;

/**
 * PlayerManager computes this once from the initial speed:
 * `0.1f * Speed / 6.5f`.
 */
export const SMOOTH_TIME = (0.1 * BASE_SPEED) / 6.5;

export const PLAYER_Y = 0;

/** Square hit size. Smaller than the drawn sprite so a graze on the art is not a death. */
export const PIECE_HIT = 0.46;

export const PIECE_VISUAL = 0.62;

export const SPAWN_Y = 12;

export const RECYCLE_Y = -12;

export const OBSTACLE_H = 2.05;

/** Camera orthographic height before a narrow viewport zooms out. */
export const VIEW_HEIGHT = 10;

/** Play span that must stay on screen, walls included. */
export const MIN_VIEW_WIDTH = 8.8;

export const TARGETS: Record<InputType, { left: number; right: number }> = {
  none: { left: -0.48, right: 0.48 },
  left: { left: -3.2, right: -2.18 },
  right: { left: 2.18, right: 3.2 },
  both: { left: -3.2, right: 3.2 },
};

export interface Rect {
  cx: number;
  cy: number;
  w: number;
  h: number;
}

/**
 * Four stances, four answers. Hit boxes are sized off the rest positions in
 * TARGETS plus PIECE_HIT, because the Unity prefabs are binary.
 *
 * - Right cluster clears a left spike. Center, left, and split all touch it.
 * - Left cluster clears a right spike.
 * - Center cluster clears spikes on both walls.
 * - Split clears a wide center gate. A compact stance still has a piece in that gate.
 * Blocks (kind 5) leave one of those three safe pockets: left, right, or center.
 */
const LEFT_SPIKE: readonly [number, number] = [-4.35, 1.5];
const RIGHT_SPIKE: readonly [number, number] = [-1.5, 4.35];
const BOTH_LEFT: readonly [number, number] = [-4.35, -1.15];
const BOTH_RIGHT: readonly [number, number] = [1.15, 4.35];
const CENTER_GATE: readonly [number, number] = [-2.58, 2.58];
const BLOCK_EXCEPT_LEFT: readonly [number, number] = [-1.55, 4.35];
const BLOCK_EXCEPT_RIGHT: readonly [number, number] = [-4.35, 1.55];

function spanRect(span: readonly [number, number], y: number): Rect {
  const [x0, x1] = span;
  return { cx: (x0 + x1) / 2, cy: y, w: x1 - x0, h: OBSTACLE_H };
}

export function obstacleRects(kind: ObstacleKind, variant: number, y: number): Rect[] {
  switch (kind) {
    case 1:
      return [spanRect(LEFT_SPIKE, y)];
    case 2:
      return [spanRect(RIGHT_SPIKE, y)];
    case 3:
      return [spanRect(BOTH_LEFT, y), spanRect(BOTH_RIGHT, y)];
    case 4:
      return [spanRect(CENTER_GATE, y)];
    case 5:
      if (variant === 0) return [spanRect(BLOCK_EXCEPT_LEFT, y)];
      if (variant === 1) return [spanRect(BLOCK_EXCEPT_RIGHT, y)];
      return [spanRect(BOTH_LEFT, y), spanRect(BOTH_RIGHT, y)];
    default:
      return [];
  }
}

export function pieceRects(left: number, right: number, y = PLAYER_Y): Rect[] {
  return [
    { cx: left, cy: y, w: PIECE_HIT, h: PIECE_HIT },
    { cx: right, cy: y, w: PIECE_HIT, h: PIECE_HIT },
  ];
}

export function rectsOverlap(a: Rect, b: Rect): boolean {
  return Math.abs(a.cx - b.cx) * 2 < a.w + b.w && Math.abs(a.cy - b.cy) * 2 < a.h + b.h;
}

export function hits(
  left: number,
  right: number,
  kind: ObstacleKind,
  variant: number,
  y: number,
): boolean {
  const pieces = pieceRects(left, right);
  return obstacleRects(kind, variant, y).some((hazard) =>
    pieces.some((piece) => rectsOverlap(piece, hazard)),
  );
}

/** The obstacle has fully passed the pieces. */
export function hasCleared(y: number): boolean {
  return y + OBSTACLE_H / 2 < PLAYER_Y - PIECE_HIT / 2;
}

export function viewSize(aspect: number): { worldW: number; worldH: number } {
  const safeAspect = Math.max(aspect, 0.2);
  let worldH = VIEW_HEIGHT;
  let worldW = worldH * safeAspect;
  if (worldW < MIN_VIEW_WIDTH) {
    worldW = MIN_VIEW_WIDTH;
    worldH = worldW / safeAspect;
  }
  return { worldW, worldH };
}

export function cameraX(left: number, right: number): number {
  return (left + right) / 20;
}
