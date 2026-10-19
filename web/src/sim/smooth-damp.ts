/**
 * Unity's Mathf.SmoothDamp (Game Programming Gems 4, 1.10), including the
 * overshoot clamp. maxSpeed defaults to infinity, as it does for the player.
 */
export function smoothDamp(
  current: number,
  target: number,
  velocity: number,
  smoothTime: number,
  deltaTime: number,
  maxSpeed = Number.POSITIVE_INFINITY,
): { value: number; velocity: number } {
  const time = Math.max(0.0001, smoothTime);
  const omega = 2 / time;
  const x = omega * deltaTime;
  const exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
  let change = current - target;
  const originalTo = target;
  const maxChange = maxSpeed * time;
  if (change > maxChange) change = maxChange;
  else if (change < -maxChange) change = -maxChange;
  const clampedTarget = current - change;
  const temp = (velocity + omega * change) * deltaTime;
  let nextVelocity = (velocity - omega * temp) * exp;
  let output = clampedTarget + (change + temp) * exp;
  if (originalTo - current > 0 === output > originalTo) {
    output = originalTo;
    nextVelocity = deltaTime !== 0 ? (output - originalTo) / deltaTime : 0;
  }
  return { value: output, velocity: nextVelocity };
}
