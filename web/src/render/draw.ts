import {
  BOUND_X,
  CAMERA_Y,
  cameraX,
  GRID_TILE,
  PIECE_HIT,
  PIECE_VISUAL,
  PLAYER_Y,
  SHAPES,
  viewSize,
  worldPolys,
  type Rect,
  type Vec,
} from "../sim/layout";
import { sampleObstacleY, type Obstacle } from "../sim/obstacles";
import { samplePlayer, type Player } from "../sim/player";
import type { ObstacleKind, Phase } from "../sim/types";

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
  color: string;
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
    this.bits = this.bits.filter((particle) => particle.life > 0);
  }

  grind(x: number, y: number, outward: number): void {
    if (this.sparks.length > 40) this.sparks.splice(0, this.sparks.length - 40);
    this.sparks.push({
      x,
      y: y + (Math.random() - 0.5) * 0.7,
      vx: outward * (0.6 + Math.random() * 1.4),
      vy: (Math.random() - 0.35) * 2.4,
      life: 0.18 + Math.random() * 0.16,
      max: 0.34,
      size: 0.07 + Math.random() * 0.08,
      color: Math.random() > 0.45 ? "#ff9a1f" : "#fff4d2",
    });
  }

  explode(left: number, right: number, y: number): void {
    this.bits = [];
    for (const x of [left, right]) {
      for (let i = 0; i < 18; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.4 + Math.random() * 4.2;
        this.bits.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0.4 + Math.random() * 0.45,
          max: 0.85,
          size: 0.1 + Math.random() * 0.16,
          color: Math.random() > 0.5 ? "#ff3b30" : "#ffb703",
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

function fillWorldRect(ctx: CanvasRenderingContext2D, projector: Projector, rect: Rect): void {
  const w = projector.s(rect.w);
  const h = projector.s(rect.h);
  ctx.fillRect(projector.x(rect.cx) - w / 2, projector.y(rect.cy) - h / 2, w, h);
}

function tracePoly(ctx: CanvasRenderingContext2D, projector: Projector, points: Vec[]): void {
  ctx.beginPath();
  points.forEach((point, index) => {
    const x = projector.x(point.x);
    const y = projector.y(point.y);
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
}

function drawGrid(
  ctx: CanvasRenderingContext2D,
  art: Art,
  projector: Projector,
  camX: number,
  camY: number,
  worldW: number,
  worldH: number,
  scroll: number,
): void {
  ctx.fillStyle = "#313233";
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  if (!art.grid) return;
  const tile = GRID_TILE;
  const left = camX - worldW / 2 - tile;
  const right = camX + worldW / 2 + tile;
  const bottom = camY - worldH / 2 - tile;
  const top = camY + worldH / 2 + tile;
  const offset = scroll % tile;
  for (let y = bottom - offset; y < top; y += tile) {
    for (let x = left - ((left % tile) + tile); x < right; x += tile) {
      const px = projector.x(x);
      const py = projector.y(y + tile);
      const size = projector.s(tile) + 0.5;
      ctx.drawImage(art.grid, px, py, size, size);
    }
  }
}

function drawBounds(
  ctx: CanvasRenderingContext2D,
  projector: Projector,
  camX: number,
  camY: number,
  worldW: number,
  worldH: number,
): void {
  const edge = camX - worldW / 2 - 2;
  const far = camX + worldW / 2 + 2;
  const height = worldH + 4;
  const leftWidth = -BOUND_X - edge;
  const rightWidth = far - BOUND_X;
  ctx.fillStyle = "rgba(8, 9, 10, 0.9)";
  fillWorldRect(ctx, projector, { cx: (edge - BOUND_X) / 2, cy: camY, w: leftWidth, h: height });
  fillWorldRect(ctx, projector, { cx: (BOUND_X + far) / 2, cy: camY, w: rightWidth, h: height });
  ctx.fillStyle = "rgba(232, 236, 242, 0.55)";
  fillWorldRect(ctx, projector, { cx: -BOUND_X, cy: camY, w: 0.045, h: height });
  fillWorldRect(ctx, projector, { cx: BOUND_X, cy: camY, w: 0.045, h: height });
}

function drawSprite(
  ctx: CanvasRenderingContext2D,
  projector: Projector,
  image: CanvasImageSource,
  cx: number,
  cy: number,
  w: number,
  h: number,
): void {
  const px = projector.x(cx);
  const py = projector.y(cy);
  const dw = projector.s(Math.abs(w));
  const dh = projector.s(h);
  ctx.save();
  ctx.translate(px, py);
  ctx.scale(w < 0 ? -1 : 1, 1);
  ctx.drawImage(image, -dw / 2, -dh / 2, dw, dh);
  ctx.restore();
}

function connectorBox(left: number, right: number): Rect | null {
  const distance = Math.max(0, right - left);
  const scaleX = 1.13 * (distance - 0.9);
  const scaleY = 1 - 0.081 * distance;
  if (scaleX <= 0.02) return null;
  return {
    cx: (left + right) / 2,
    cy: PLAYER_Y,
    w: scaleX * PIECE_VISUAL,
    h: Math.max(0.08, scaleY) * PIECE_VISUAL,
  };
}

function drawObstacle(
  ctx: CanvasRenderingContext2D,
  art: Art,
  projector: Projector,
  kind: ObstacleKind,
  y: number,
  debug: boolean,
): void {
  const shape = SHAPES[kind];
  const polys = worldPolys(kind, y);
  if (kind === 5) {
    ctx.fillStyle = "#111111";
    for (const poly of polys) {
      tracePoly(ctx, projector, poly);
      ctx.fill();
    }
  }
  for (const slot of shape.sprites) {
    const image = slot.art === "diamond" ? art.diamond : art.spike;
    const cx = slot.x + shape.anchorX;
    const cy = slot.y + y;
    if (image) drawSprite(ctx, projector, image, cx, cy, slot.w, slot.h);
    else {
      ctx.fillStyle = "#212121";
      for (const poly of polys) {
        tracePoly(ctx, projector, poly);
        ctx.fill();
      }
    }
  }
  if (debug) {
    ctx.strokeStyle = "#ff4d6a";
    ctx.lineWidth = 1;
    for (const poly of polys) {
      tracePoly(ctx, projector, poly);
      ctx.stroke();
    }
  }
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
  const camY = CAMERA_Y + Math.cos(time * 37) * 0.1 * shake;
  const projector = makeProjector(camX, camY, worldW, worldH, width, height);

  ctx.clearRect(0, 0, width, height);
  drawGrid(ctx, art, projector, camX, camY, worldW, worldH, scene.scroll);

  for (const obstacle of scene.obstacles) {
    if (!obstacle.alive) continue;
    drawObstacle(ctx, art, projector, obstacle.kind, sampleObstacleY(obstacle, scene.alpha), scene.debug);
  }
  drawBounds(ctx, projector, camX, camY, worldW, worldH);

  if (showPieces) {
    const bar = connectorBox(pose.left, pose.right);
    if (bar) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
      fillWorldRect(ctx, projector, bar);
    }
  }

  for (const spark of fx.sparks) {
    ctx.globalAlpha = Math.max(0, spark.life / spark.max);
    ctx.fillStyle = spark.color;
    fillWorldRect(ctx, projector, { cx: spark.x, cy: spark.y, w: spark.size, h: spark.size });
    ctx.globalAlpha = 1;
  }

  if (showPieces) {
    for (const x of [pose.left, pose.right]) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
      fillWorldRect(ctx, projector, {
        cx: x,
        cy: PLAYER_Y,
        w: PIECE_VISUAL * 1.12,
        h: PIECE_VISUAL * 1.12,
      });
      const size = projector.s(PIECE_VISUAL);
      const px = projector.x(x) - size / 2;
      const py = projector.y(PLAYER_Y) - size / 2;
      if (art.player) ctx.drawImage(art.player, px, py, size, size);
      else {
        ctx.fillStyle = "#f9f9f9";
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
    ctx.fillStyle = bit.color;
    fillWorldRect(ctx, projector, { cx: bit.x, cy: bit.y, w: bit.size, h: bit.size });
    ctx.globalAlpha = 1;
  }
}

export function grinding(left: number, right: number): { x: number; outward: number }[] {
  const sparks: { x: number; outward: number }[] = [];
  if (left < -2.95) sparks.push({ x: left, outward: -1 });
  if (right > 2.95) sparks.push({ x: right, outward: 1 });
  return sparks;
}
