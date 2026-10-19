import { AudioBus } from "./audio";
import { startLoop } from "./loop";
import { drawScene, Effects, grinding } from "./render/draw";
import { createGame, startRun, step, type GameState } from "./sim/game";
import { combineInput, mapKeys, mapPointers, type KeyState } from "./sim/input";
import { FIXED_DT, PLAYER_Y } from "./sim/layout";
import { samplePlayer } from "./sim/player";
import { shownScore } from "./sim/score";
import "./style.css";
import { Ui } from "./ui";

const HIGH_KEY = "fragments.highscore";
const MUTE_KEY = "fragments.muted";

function readHighScore(): number {
  const value = Number(localStorage.getItem(HIGH_KEY));
  return Number.isFinite(value) && value > 0 ? Math.trunc(value) : 0;
}

function readMuted(): boolean {
  return localStorage.getItem(MUTE_KEY) === "1";
}

function boot(): void {
  const canvas = document.querySelector("#game");
  if (!(canvas instanceof HTMLCanvasElement)) throw new Error("Missing canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Missing canvas context");

  const ui = new Ui();
  const audio = new AudioBus();
  audio.muted = readMuted();
  ui.setMuted(audio.muted);
  const fx = new Effects();
  const art = {
    player: null as CanvasImageSource | null,
    spike: null as CanvasImageSource | null,
    diamond: null as CanvasImageSource | null,
    grid: null as CanvasImageSource | null,
  };

  const game: GameState = createGame(readHighScore());
  const keys: KeyState = { left: false, right: false, both: false };
  const pointers = new Map<number, number>();
  let ignoreSpace = false;
  let savedHigh = game.highScore;
  const debug = new URLSearchParams(location.search).has("debug");

  const resize = () => {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const width = Math.max(1, Math.floor(canvas.clientWidth * dpr));
    const height = Math.max(1, Math.floor(canvas.clientHeight * dpr));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
  };
  resize();
  window.addEventListener("resize", resize);

  const play = () => {
    audio.unlock();
    audio.play("hint", 0.7);
    audio.playMusic();
    startRun(game);
    fx.bits = [];
  };

  ui.onPlay = play;
  ui.onMute = () => {
    audio.unlock();
    audio.setMuted(!audio.muted);
    localStorage.setItem(MUTE_KEY, audio.muted ? "1" : "0");
    ui.setMuted(audio.muted);
  };

  window.addEventListener("keydown", (event) => {
    if (event.code === "ArrowLeft" || event.code === "KeyA") keys.left = true;
    if (event.code === "ArrowRight" || event.code === "KeyD") keys.right = true;
    if (event.code === "Space") keys.both = true;
    if (event.code === "ArrowLeft" || event.code === "ArrowRight" || event.code === "Space") {
      event.preventDefault();
    }
    const menuOpen = game.phase === "menu" || game.phase === "dead";
    if (menuOpen && (event.code === "Enter" || event.code === "Space")) {
      if ((event.target as HTMLElement | null)?.id === "mute") return;
      if (event.code === "Space") ignoreSpace = true;
      play();
    }
    if (event.code === "KeyM") ui.onMute();
  });

  window.addEventListener("keyup", (event) => {
    if (event.code === "ArrowLeft" || event.code === "KeyA") keys.left = false;
    if (event.code === "ArrowRight" || event.code === "KeyD") keys.right = false;
    if (event.code === "Space") {
      keys.both = false;
      ignoreSpace = false;
    }
  });

  window.addEventListener("blur", () => {
    keys.left = false;
    keys.right = false;
    keys.both = false;
    pointers.clear();
  });

  canvas.addEventListener("pointerdown", (event) => {
    if (game.phase === "menu" || game.phase === "dead") return;
    canvas.setPointerCapture(event.pointerId);
    pointers.set(event.pointerId, event.clientX);
    audio.unlock();
  });
  canvas.addEventListener("pointermove", (event) => {
    if (pointers.has(event.pointerId)) pointers.set(event.pointerId, event.clientX);
  });
  const release = (event: PointerEvent) => pointers.delete(event.pointerId);
  canvas.addEventListener("pointerup", release);
  canvas.addEventListener("pointercancel", release);

  const loadImage = (path: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(path));
      image.src = `${import.meta.env.BASE_URL}${path}`;
    });

  void Promise.allSettled([
    loadImage("sprites/player.png"),
    loadImage("sprites/spike.png"),
    loadImage("sprites/diamond.png"),
    loadImage("sprites/grid.png"),
  ]).then((results) => {
    if (results[0].status === "fulfilled") art.player = results[0].value;
    if (results[1].status === "fulfilled") art.spike = results[1].value;
    if (results[2].status === "fulfilled") art.diamond = results[2].value;
    if (results[3].status === "fulfilled") art.grid = results[3].value;
  });
  void audio.load();

  ui.sync(game.phase, 0, game.highScore, 0);
  if (debug) {
    (window as unknown as { __fragments: GameState }).__fragments = game;
  }

  startLoop(
    () => {
      const rect = canvas.getBoundingClientRect();
      const pointer = mapPointers(
        [...pointers.values()].map((clientX) => clientX - rect.left),
        rect.width,
      );
      const keyState = ignoreSpace ? { ...keys, both: false } : keys;
      const input = game.phase === "playing" ? combineInput(mapKeys(keyState), pointer) : "none";
      const before = game.phase;
      step(game, input, FIXED_DT);
      if (before !== "dying" && game.phase === "dying") {
        fx.explode(game.deathLeft, game.deathRight, PLAYER_Y);
        audio.setGrinding(false);
        audio.play("explosion", 0.9);
        audio.play("flame", 0.35);
      }
      if (game.highScore !== savedHigh) {
        savedHigh = game.highScore;
        localStorage.setItem(HIGH_KEY, String(game.highScore));
      }
      const pose = samplePlayer(game.player, 1);
      const sparks = game.phase === "playing" ? grinding(pose.left, pose.right) : [];
      audio.setGrinding(sparks.length > 0 && !audio.muted);
      for (const spark of sparks) fx.grind(spark.x, PLAYER_Y, spark.outward);
      fx.update(FIXED_DT);
    },
    (alpha) => {
      resize();
      ui.sync(game.phase, shownScore(game.score), game.highScore, game.runTime);
      drawScene(
        ctx,
        art,
        fx,
        {
          phase: game.phase,
          alpha,
          shake: game.shake,
          scroll: game.scroll,
          player: game.player,
          obstacles: game.field.items,
          deathLeft: game.deathLeft,
          deathRight: game.deathRight,
          debug,
        },
        canvas.width,
        canvas.height,
        performance.now() / 1000,
      );
    },
  );
}

boot();
