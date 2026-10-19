import { FIXED_DT } from "./sim/layout";

export function startLoop(update: (dt: number) => void, render: (alpha: number) => void): void {
  let last = performance.now();
  let acc = 0;

  const frame = (now: number) => {
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.1) dt = 0.1;
    if (dt < 0) dt = 0;
    acc += dt;
    let steps = 0;
    while (acc >= FIXED_DT && steps < 5) {
      update(FIXED_DT);
      acc -= FIXED_DT;
      steps += 1;
    }
    if (acc > FIXED_DT) acc = 0;
    render(FIXED_DT === 0 ? 0 : acc / FIXED_DT);
    requestAnimationFrame(frame);
  };

  requestAnimationFrame(frame);
}
