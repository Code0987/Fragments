import {
  cameraX,
  obstacleRects,
  PIECE_HIT,
  PIECE_VISUAL,
  PLAYER_Y,
  viewSize,
  type Rect,
} from "../sim/layout";
import { sampleObstacleY, type Obstacle } from "../sim/obstacles";
import { samplePlayer, type Player } from "../sim/player";
import type { Phase } from "../sim/types";

export interface Art {
  player: CanvasImageSource | null;
  spike: CanvasImageSource | null;
  diamond: CanvasImageSource | null;
  grid: CanvasImageSource | null;
}

export interface Scene {
  phase: Phase;
  alpha: number;
  shake: number;
  scroll: number;
  player: Player;
  obstacles: readonly Obstacle[];
  deathLeft: number;
  deathRight: number;
  debug: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
}

export class Effects {
  sparks: Particle[] = [];
  bits: Particle[] = [];

  update(dt: number): void {
    for (const spark of this.sparks) {
      spark.life -= dt;
      spark.x += spark.vx * dt;
      spark.y += spark.vy * dt;
    }
    this.sparks = this.sparks.filter((spark) => spark.life > 0);
    for (const bit of this.bits) {
      bit.life -= dt;
      bit.x += bit.vx * dt;
      bit.y += bit.vy * dt;
      bit.vy -= 9 * dt;
    }
    this.bits = this.bits.filter((p) => p.life > 0);
  }

  grind(x: number, y: number, outward: number): void {
    if (this.sparks.length > 48) this.sparks.splice(0, this.sparks.length - 48);
    for (let i = 0; i < 2; i++) {
      this.sparks.push({
        x,
        y: y + (Math.random() - 0.5) * 0.4,
        vx: outward * (1.2 + Math.random()),
        vy: 1.5 + Math.random() * 2.2,
        life: 0.12 + Math.random() * 0.12,
        max: 0.24,
        size: 0.05 + Math.random() * 0.06,
      });
    }
  }

  explode(left: number, right: number, y: number): void {
    this.bits = [];
    for (const x of [left, right]) {
      for (let i = 0; i < 16; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.5 + Math.random() * 4.5;
        this.bits.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0.35 + Math.random() * 0.4,
          max: 0.75,
          size: 0.08 + Math.random() * 0.14,
        });
      }
    }
  }
}

interface Projector {
  x(wx: number): number;
  y(wy: number): number;
  s(units: number): number;
}

function makeProjector(
  camX: number,
  camY: number,
  worldW: number,
  worldH: number,
  canvasW: number,
  canvasH: number,
): Projector {
  return {
    x: (wx) => ((wx - camX + worldW / 2) / worldW) * canvasW,
    y: (wy) => ((camY + worldH / 2 - wy) / worldH) * canvasH,
    s: (units) => (units / worldH) * canvasH,
  };
}

function fillRect(ctx: CanvasRenderingContext2D, projector: Projector, rect: Rect): void {
  const w = projector.s(rect.w);
  const h = projector.s(rect.h);
  ctx.fillRect(projector.x(rect.cx) - w / 2, projector.y(rect.cy) - h / 2, w, h);
}

function strokeHazard(ctx: CanvasRenderingContext2D, projector: Projector, rect: Rect): void {
  const w = projector.s(rect.w);
  const h = projector.s(rect.h);
  const x = projector.x(rect.cx) - w / 2;
  const y = projector.y(rect.cy) - h / 2;
  ctx.fillStyle = "#10141c";
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = "rgba(244, 247, 251, 0.92)";
  ctx.lineWidth = Math.max(1.5, projector.s(0.045));
  ctx.strokeRect(x + ctx.lineWidth / 2, y + ctx.lineWidth / 2, w - ctx.lineWidth, h - ctx.lineWidth);
  const shine = ctx.createLinearGradient(x, y, x, y + h);
  shine.addColorStop(0, "rgba(255,255,255,0.16)");
  shine.addColorStop(0.45, "rgba(255,255,255,0)");
  ctx.fillStyle = shine;
  ctx.fillRect(x, y, w, h * 0.5);
}

function drawGrid(
  ctx: CanvasRenderingContext2D,
  art: Art,
  projector: Projector,
  camY: number,
  worldW: number,
  worldH: number,
  scroll: number,
): void {
  const tile = 4;
  const left = -worldW / 2 - tile;
  const right = worldW / 2 + tile;
  const bottom = camY - worldH / 2 - tile;
  const top = camY + worldH / 2 + tile;
  const offset = scroll % tile;
  if (art.grid) {
    for (let y = bottom - offset; y < top; y += tile) {
      for (let x = left; x < right; x += tile) {
        const px = projector.x(x);
        const py = projector.y(y + tile);
        const size = projector.s(tile) + 0.5;
        ctx.drawImage(art.grid, px, py, size, size);
      }
    }
    return;
  }
  ctx.fillStyle = "#1a2636";
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

function drawConnector(
  ctx: CanvasRenderingContext2D,
  projector: Projector,
  left: number,
  right: number,
): void {
  const distance = Math.max(0, right - left);
  const length = 1.13 * (distance - 0.9);
  if (length <= 0.05) return;
  const thickness = Math.max(0.1, (1 - 0.081 * distance) * 0.42);
  const rect = { cx: (left + right) / 2, cy: PLAYER_Y, w: length, h: thickness };
  ctx.fillStyle = "rgba(232, 238, 246, 0.92)";
  fillRect(ctx, projector, rect);
}

export function drawScene(
  ctx: CanvasRenderingContext2D,
  art: Art,
  fx: Effects,
  scene: Scene,
  width: number,
  height: number,
  time: number,
): void {
  const pose =
    scene.phase === "dying"
      ? { left: scene.deathLeft, right: scene.deathRight }
      : samplePlayer(scene.player, scene.alpha);
  const showPieces = scene.phase === "playing";
  const { worldW, worldH } = viewSize(width / Math.max(height, 1));
  const shake = scene.phase === "dying" ? scene.shake : 0;
  const camX = cameraX(pose.left, pose.right) + Math.sin(time * 48) * 0.16 * shake;
  const camY = Math.cos(time * 37) * 0.1 * shake;
  const projector = makeProjector(camX, camY, worldW, worldH, width, height);

  ctx.clearRect(0, 0, width, height);
  drawGrid(ctx, art, projector, camY, worldW, worldH, scene.scroll);

  ctx.fillStyle = "rgba(8, 12, 18, 0.55)";
  fillRect(ctx, projector, { cx: -4.28, cy: 0, w: 0.16, h: 40 });
  fillRect(ctx, projector, { cx: 4.28, cy: 0, w: 0.16, h: 40 });

  for (const obstacle of scene.obstacles) {
    if (!obstacle.alive) continue;
    const y = sampleObstacleY(obstacle, scene.alpha);
    for (const rect of obstacleRects(obstacle.kind, obstacle.variant, y)) {
      strokeHazard(ctx, projector, rect);
      if (obstacle.kind === 4 && art.diamond) {
        const size = projector.s(Math.min(rect.w, rect.h) * 0.92);
        ctx.drawImage(art.diamond, projector.x(rect.cx) - size / 2, projector.y(rect.cy) - size / 2, size, size);
      } else if ((obstacle.kind === 1 || obstacle.kind === 2 || obstacle.kind === 3) && art.spike) {
        const w = projector.s(rect.w);
        const h = projector.s(rect.h);
        const x = projector.x(rect.cx) - w / 2;
        const yPx = projector.y(rect.cy) - h / 2;
        ctx.save();
        ctx.globalAlpha = 0.55;
        ctx.drawImage(art.spike, x, yPx, w, h);
        ctx.restore();
      }
      if (scene.debug) {
        ctx.save();
        ctx.strokeStyle = "#ff4d6a";
        ctx.lineWidth = 1;
        const w = projector.s(rect.w);
        const h = projector.s(rect.h);
        ctx.strokeRect(projector.x(rect.cx) - w / 2, projector.y(rect.cy) - h / 2, w, h);
        ctx.restore();
      }
    }
  }

  if (showPieces) drawConnector(ctx, projector, pose.left, pose.right);

  for (const spark of fx.sparks) {
    ctx.globalAlpha = Math.max(0, spark.life / spark.max);
    ctx.fillStyle = "#f4f7fb";
    fillRect(ctx, projector, { cx: spark.x, cy: spark.y, w: spark.size, h: spark.size * 1.8 });
    ctx.globalAlpha = 1;
  }

  if (showPieces) {
    for (const x of [pose.left, pose.right]) {
      const size = projector.s(PIECE_VISUAL);
      const px = projector.x(x) - size / 2;
      const py = projector.y(PLAYER_Y) - size / 2;
      ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
      ctx.fillRect(px + size * 0.08, py + size * 0.1, size, size);
      if (art.player) ctx.drawImage(art.player, px, py, size, size);
      else {
        ctx.fillStyle = "#f4f7fb";
        ctx.fillRect(px, py, size, size);
      }
      if (scene.debug) {
        ctx.strokeStyle = "#7dffb3";
        ctx.lineWidth = 1;
        const hit = projector.s(PIECE_HIT);
        ctx.strokeRect(projector.x(x) - hit / 2, projector.y(PLAYER_Y) - hit / 2, hit, hit);
      }
    }
  }

  for (const bit of fx.bits) {
    ctx.globalAlpha = Math.max(0, bit.life / bit.max);
    ctx.fillStyle = "#f7f8fa";
    fillRect(ctx, projector, { cx: bit.x, cy: bit.y, w: bit.size, h: bit.size });
    ctx.globalAlpha = 1;
  }

  const vignette = ctx.createLinearGradient(0, 0, 0, height);
  vignette.addColorStop(0, "rgba(12, 18, 28, 0.45)");
  vignette.addColorStop(0.14, "rgba(12, 18, 28, 0)");
  vignette.addColorStop(0.86, "rgba(12, 18, 28, 0)");
  vignette.addColorStop(1, "rgba(12, 18, 28, 0.5)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);
}

export function grinding(left: number, right: number): { x: number; outward: number }[] {
  const sparks: { x: number; outward: number }[] = [];
  if (left < -2.95) sparks.push({ x: left, outward: -1 });
  if (right > 2.95) sparks.push({ x: right, outward: 1 });
  return sparks;
}
