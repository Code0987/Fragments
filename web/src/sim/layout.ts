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

/**
 * PlayScene main camera is orthographic with size 9, sitting at y = 0.
 * The player object is at world y = -4.6, and spikes spawn at world y = 12,
 * so there is about two seconds of travel before the first hit.
 */
export const PLAYER_Y = -4.6;

export const CAMERA_Y = 0;

export const ORTHO_SIZE = 9;

/** Square collider on PlayerPiece. */
export const PIECE_HIT = 0.9;

/** player.png is 90px at 100 pixels per unit. */
export const PIECE_VISUAL = 0.9;

export const SPAWN_Y = 12;

export const RECYCLE_Y = -14;

/** Camera orthographic height before a narrow viewport zooms out. */
export const VIEW_HEIGHT = ORTHO_SIZE * 2;

/** Play span that must stay on screen, walls included. */
export const MIN_VIEW_WIDTH = 10.4;

/** BackgroundNavyGridSprite is 512px at 204.8 pixels per unit. */
export const GRID_TILE = 512 / 204.8;

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

export interface Vec {
  x: number;
  y: number;
}

export interface SpriteSlot {
  art: "spike" | "diamond";
  /** Center relative to the obstacle root. Negative width flips the sprite. */
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ObstacleShape {
  anchorX: number;
  /** Collider polygons from the prefabs, in root-local space. */
  polys: Vec[][];
  sprites: SpriteSlot[];
  bottom: number;
  top: number;
}

const SPIKE_W = 6;
const SPIKE_H = 4.01;
const DIAMOND_W = 4.5;
const DIAMOND_H = 4;

function scalePoints(points: Vec[], sx: number, sy: number, ox = 0, oy = 0): Vec[] {
  return points.map((point) => ({ x: ox + point.x * sx, y: oy + point.y * sy }));
}

const leftBlade: Vec[] = [
  { x: 3.03292346, y: 2.0074091 },
  { x: -2.99295187, y: 0.74635696 },
  { x: -3.00118208, y: -2.02361107 },
];
const rightBlade: Vec[] = [
  { x: 3.03292346, y: 2.0074091 },
  { x: -3.00225115, y: 0.7304306 },
  { x: -2.99348688, y: -2.02361107 },
];
const sideBlade: Vec[] = [
  { x: 3.0653677, y: 2.02299428 },
  { x: -3.00000048, y: 0.7415421 },
  { x: -3.00000024, y: -1.99961853 },
];
const centerDiamond: Vec[] = [
  { x: 2.26061726, y: -0.00876427 },
  { x: 0.01938252, y: 2.01061726 },
  { x: -2.26061749, y: -0.00185204 },
  { x: 0.00185216, y: -2 },
];

function blockPoly(cx: number): Vec[] {
  const h = 0.8;
  return [
    { x: cx - h, y: -h },
    { x: cx + h, y: -h },
    { x: cx + h, y: h },
    { x: cx - h, y: h },
  ];
}

function extremes(polys: Vec[][]): { bottom: number; top: number } {
  const ys = polys.flat().map((point) => point.y);
  return { bottom: Math.min(...ys), top: Math.max(...ys) };
}

/** Prefab scales and polygon colliders. Root x is kept when the generator respawns them. */
export const SHAPES: Record<ObstacleKind, ObstacleShape> = {
  1: {
    anchorX: -1.5,
    polys: [scalePoints(leftBlade, 0.72, 0.72)],
    sprites: [{ art: "spike", x: 0, y: 0, w: SPIKE_W * 0.72, h: SPIKE_H * 0.72 }],
    bottom: 0,
    top: 0,
  },
  2: {
    anchorX: 1.5,
    polys: [scalePoints(rightBlade, -0.72, 0.72)],
    sprites: [{ art: "spike", x: 0, y: 0, w: SPIKE_W * -0.72, h: SPIKE_H * 0.72 }],
    bottom: 0,
    top: 0,
  },
  3: {
    anchorX: 0,
    polys: [-1, 1].map((side) =>
      scalePoints(sideBlade, side * 0.57, 0.53, side * 3.7, 0).map((point) => ({
        x: point.x * 0.72,
        y: point.y * 0.72,
      })),
    ),
    sprites: [-1, 1].map((side) => ({
      art: "spike" as const,
      x: side * 3.7 * 0.72,
      y: 0,
      w: side * SPIKE_W * 0.72 * 0.57,
      h: SPIKE_H * 0.72 * 0.53,
    })),
    bottom: 0,
    top: 0,
  },
  4: {
    anchorX: 0,
    polys: [scalePoints(centerDiamond, 0.7, 0.72)],
    sprites: [{ art: "diamond", x: 0, y: 0, w: DIAMOND_W * 0.7, h: DIAMOND_H * 0.72 }],
    bottom: 0,
    top: 0,
  },
  5: {
    anchorX: 0,
    polys: [blockPoly(-2.8), blockPoly(2.8)],
    sprites: [],
    bottom: 0,
    top: 0,
  },
};

for (const shape of Object.values(SHAPES)) {
  const span = extremes(shape.polys);
  shape.bottom = span.bottom;
  shape.top = span.top;
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

function rectPoly(rect: Rect): Vec[] {
  return [
    { x: rect.cx - rect.w / 2, y: rect.cy - rect.h / 2 },
    { x: rect.cx + rect.w / 2, y: rect.cy - rect.h / 2 },
    { x: rect.cx + rect.w / 2, y: rect.cy + rect.h / 2 },
    { x: rect.cx - rect.w / 2, y: rect.cy + rect.h / 2 },
  ];
}

function projectOnto(points: Vec[], axis: Vec): { min: number; max: number } {
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (const point of points) {
    const dot = point.x * axis.x + point.y * axis.y;
    if (dot < min) min = dot;
    if (dot > max) max = dot;
  }
  return { min, max };
}

function polygonsOverlap(a: Vec[], b: Vec[]): boolean {
  const axes: Vec[] = [];
  for (const poly of [a, b]) {
    for (let i = 0; i < poly.length; i++) {
      const next = poly[(i + 1) % poly.length];
      axes.push({ x: -(next.y - poly[i].y), y: next.x - poly[i].x });
    }
  }
  for (const axis of axes) {
    if (axis.x === 0 && axis.y === 0) continue;
    const pa = projectOnto(a, axis);
    const pb = projectOnto(b, axis);
    if (pa.max < pb.min || pb.max < pa.min) return false;
  }
  return true;
}

export function worldPolys(kind: ObstacleKind, y: number): Vec[][] {
  const shape = SHAPES[kind];
  return shape.polys.map((poly) =>
    poly.map((point) => ({ x: point.x + shape.anchorX, y: point.y + y })),
  );
}

export function hits(
  left: number,
  right: number,
  kind: ObstacleKind,
  _variant: number,
  y: number,
): boolean {
  const pieces = pieceRects(left, right).map(rectPoly);
  return worldPolys(kind, y).some((poly) => pieces.some((piece) => polygonsOverlap(piece, poly)));
}

/** The whole hazard is below the pieces, so it can no longer hit them. */
export function hasCleared(kind: ObstacleKind, y: number): boolean {
  return y + SHAPES[kind].top < PLAYER_Y - PIECE_HIT / 2;
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
