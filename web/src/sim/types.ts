export type InputType = "left" | "right" | "both" | "none";

export type Phase = "menu" | "playing" | "dying" | "dead";

/** 1 left, 2 right, 3 both walls, 4 center, 5 blocks. Matches ObstacleGenerator. */
export type ObstacleKind = 1 | 2 | 3 | 4 | 5;

export function isKind(n: number): n is ObstacleKind {
  return n === 1 || n === 2 || n === 3 || n === 4 || n === 5;
}
