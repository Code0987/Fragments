import { hasCleared, RECYCLE_Y, SHAPES, SPAWN_Y } from "./layout";
import type { ObstacleKind } from "./types";
import { isKind } from "./types";

/** Last two spawned ids. Same rules as ObstacleGenerator.SpecialQueue. */
export interface Queue {
  latest: number;
  previous: number;
}

export function createQueue(): Queue {
  return { latest: -1, previous: -1 };
}

export function alerts(queue: Queue, num: number): boolean {
  if (queue.latest === 4 && num === 4) return true;
  return queue.latest === queue.previous && queue.latest === num;
}

export function pushId(queue: Queue, num: number): void {
  queue.previous = queue.latest;
  queue.latest = num;
}

/** True when the id just pushed is a center spike after a left or right spike. */
export function isCenterFollowUp(queue: Queue): boolean {
  return queue.latest === 4 && queue.previous < 3;
}

/** Unity Random.Range(1, maxExclusive). Retries while SpecialQueue.IsAlert. */
export function rollId(queue: Queue, maxExclusive: number, rng: () => number): number {
  const span = Math.max(1, maxExclusive - 1);
  let pick = 1 + Math.floor(rng() * span);
  for (let i = 0; i < 24 && alerts(queue, pick); i++) {
    pick = 1 + Math.floor(rng() * span);
  }
  pushId(queue, pick);
  return pick;
}

export interface Obstacle {
  alive: boolean;
  kind: ObstacleKind;
  variant: number;
  y: number;
  prevY: number;
  scored: boolean;
}

export interface ObstacleField {
  items: Obstacle[];
  queue: Queue;
  nextKind: ObstacleKind;
  wait: number;
  /** Starts at 1, same as ObstacleGenerator.Start. Blocks unlock after 40 real spawns. */
  generated: number;
  maxExclusive: number;
}

function asKind(n: number): ObstacleKind {
  if (!isKind(n)) return 1;
  return n;
}

export function createField(rng: () => number): ObstacleField {
  const field: ObstacleField = {
    items: [],
    queue: createQueue(),
    nextKind: 1,
    wait: 0,
    generated: 1,
    maxExclusive: 5,
  };
  field.nextKind = asKind(rollId(field.queue, field.maxExclusive, rng));
  return field;
}

export function spawnNext(field: ObstacleField, speed: number, rng: () => number): void {
  let slot = field.items.find((item) => !item.alive);
  if (!slot) {
    slot = { alive: false, kind: 1, variant: 0, y: 0, prevY: 0, scored: false };
    field.items.push(slot);
  }
  slot.alive = true;
  slot.kind = field.nextKind;
  slot.variant = field.nextKind === 5 ? Math.min(2, Math.floor(rng() * 3)) : 0;
  slot.y = SPAWN_Y;
  slot.prevY = SPAWN_Y;
  slot.scored = false;

  field.generated += 1;
  if (field.generated > 40 && field.maxExclusive === 5) field.maxExclusive = 6;

  field.nextKind = asKind(rollId(field.queue, field.maxExclusive, rng));
  const gap = isCenterFollowUp(field.queue) ? 1.3 : 1.1;
  field.wait = (gap * 6.5) / Math.max(speed, 0.01);
}

export function stepField(
  field: ObstacleField,
  speed: number,
  dt: number,
  rng: () => number,
  allowSpawn: boolean,
  onClear: (obstacle: Obstacle) => void,
): void {
  for (const obstacle of field.items) {
    if (!obstacle.alive) continue;
    obstacle.prevY = obstacle.y;
    obstacle.y -= speed * dt;
    if (!obstacle.scored && hasCleared(obstacle.kind, obstacle.y)) {
      obstacle.scored = true;
      onClear(obstacle);
    }
    if (obstacle.y + SHAPES[obstacle.kind].bottom < RECYCLE_Y) obstacle.alive = false;
  }
  if (!allowSpawn) return;
  if (field.wait > 0) field.wait -= dt;
  else spawnNext(field, speed, rng);
}

export function sampleObstacleY(obstacle: Obstacle, alpha: number): number {
  const t = Math.min(Math.max(alpha, 0), 1);
  return obstacle.prevY + (obstacle.y - obstacle.prevY) * t;
}
