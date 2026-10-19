import { BASE_SPEED, hits } from "./layout";
import { createField, stepField, type ObstacleField } from "./obstacles";
import { createPlayer, stepPlayer, type Player } from "./player";
import { clearedScore, shownScore } from "./score";
import type { InputType, Phase } from "./types";

const DEATH_TIME = 0.85;

export interface GameState {
  phase: Phase;
  speed: number;
  score: number;
  highScore: number;
  scroll: number;
  runTime: number;
  deathTimer: number;
  shake: number;
  player: Player;
  field: ObstacleField;
  deathLeft: number;
  deathRight: number;
  rng: () => number;
}

export function createGame(highScore = 0, rng: () => number = Math.random): GameState {
  return {
    phase: "menu",
    speed: BASE_SPEED,
    score: 0,
    highScore,
    scroll: 0,
    runTime: 0,
    deathTimer: 0,
    shake: 0,
    player: createPlayer(),
    field: createField(rng),
    deathLeft: -0.48,
    deathRight: 0.48,
    rng,
  };
}

export function startRun(game: GameState): void {
  game.phase = "playing";
  game.speed = BASE_SPEED;
  game.score = 0;
  game.runTime = 0;
  game.deathTimer = 0;
  game.shake = 0;
  game.player = createPlayer();
  game.field = createField(game.rng);
  game.deathLeft = game.player.left;
  game.deathRight = game.player.right;
}

function kill(game: GameState): void {
  game.phase = "dying";
  game.deathTimer = DEATH_TIME;
  game.shake = 1;
  game.deathLeft = game.player.left;
  game.deathRight = game.player.right;
}

export function step(game: GameState, input: InputType, dt: number): void {
  if (game.phase === "menu" || game.phase === "dead") {
    game.scroll += 0.35 * dt;
    game.shake = 0;
    return;
  }

  if (game.phase === "playing") {
    game.speed += dt / 7;
    game.runTime += dt;
    game.scroll += game.speed * dt;
    stepPlayer(game.player, input, dt);
    stepField(game.field, game.speed, dt, game.rng, true, (obstacle) => {
      game.score += clearedScore(game.speed, obstacle.kind);
      const shown = shownScore(game.score);
      if (shown > game.highScore) game.highScore = shown;
    });
    const hit = game.field.items.some(
      (obstacle) =>
        obstacle.alive &&
        hits(game.player.left, game.player.right, obstacle.kind, obstacle.variant, obstacle.y),
    );
    if (hit) kill(game);
    return;
  }

  game.scroll += game.speed * dt;
  stepField(game.field, game.speed, dt, game.rng, false, () => {});
  game.deathTimer -= dt;
  game.shake = Math.max(0, game.deathTimer / DEATH_TIME);
  if (game.deathTimer <= 0) {
    game.phase = "dead";
    game.shake = 0;
    game.player = createPlayer();
    for (const obstacle of game.field.items) obstacle.alive = false;
  }
}
