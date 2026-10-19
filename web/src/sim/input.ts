import type { InputType } from "./types";

export interface KeyState {
  left: boolean;
  right: boolean;
  both: boolean;
}

/** Left half, right half, one contact on each side is Both. Two on one side stay on that side. */
export function mapPointers(xs: readonly number[], width: number): InputType {
  if (width <= 0 || xs.length === 0) return "none";
  const half = width / 2;
  let left = false;
  let right = false;
  const count = Math.min(xs.length, 2);
  for (let i = 0; i < count; i++) {
    if (xs[i] < half) left = true;
    else right = true;
  }
  if (left && right) return "both";
  if (left) return "left";
  if (right) return "right";
  return "none";
}

/** Arrows or A/D pick a side. Space, or both sides at once, splits. */
export function mapKeys(keys: KeyState): InputType {
  if (keys.both || (keys.left && keys.right)) return "both";
  if (keys.right) return "right";
  if (keys.left) return "left";
  return "none";
}

export function combineInput(key: InputType, pointer: InputType): InputType {
  if (key === "none") return pointer;
  if (pointer === "none") return key;
  if (key === pointer) return key;
  return "both";
}
