import type { Phase } from "./sim/types";

const base = import.meta.env.BASE_URL;

export class Ui {
  private readonly menu: HTMLElement;
  private readonly title: HTMLElement;
  private readonly blurb: HTMLElement;
  private readonly score: HTMLElement;
  private readonly coach: HTMLElement;
  private readonly muteIcon: HTMLImageElement;
  private readonly playButton: HTMLButtonElement;
  private readonly muteButton: HTMLButtonElement;

  onPlay: () => void = () => {};
  onMute: () => void = () => {};

  constructor(root: ParentNode = document) {
    const menu = root.querySelector("#menu");
    const title = root.querySelector("#title");
    const blurb = root.querySelector("#blurb");
    const score = root.querySelector("#score");
    const coach = root.querySelector("#coach");
    const muteIcon = root.querySelector("#mute-icon");
    const playButton = root.querySelector("#play");
    const muteButton = root.querySelector("#mute");
    if (
      !(menu instanceof HTMLElement) ||
      !(title instanceof HTMLElement) ||
      !(blurb instanceof HTMLElement) ||
      !(score instanceof HTMLElement) ||
      !(coach instanceof HTMLElement) ||
      !(muteIcon instanceof HTMLImageElement) ||
      !(playButton instanceof HTMLButtonElement) ||
      !(muteButton instanceof HTMLButtonElement)
    ) {
      throw new Error("Game page is missing a UI node");
    }
    this.menu = menu;
    this.title = title;
    this.blurb = blurb;
    this.score = score;
    this.coach = coach;
    this.muteIcon = muteIcon;
    this.playButton = playButton;
    this.muteButton = muteButton;
    this.playButton.addEventListener("click", () => this.onPlay());
    this.muteButton.addEventListener("click", () => this.onMute());
  }

  setMuted(muted: boolean): void {
    this.muteIcon.src = `${base}sprites/${muted ? "mute" : "sound"}.png`;
    this.muteButton.setAttribute("aria-label", muted ? "Unmute" : "Mute");
    this.muteButton.setAttribute("aria-pressed", muted ? "true" : "false");
  }

  sync(phase: Phase, score: number, highScore: number, runTime: number): void {
    const inRun = phase === "playing" || phase === "dying";
    this.score.hidden = !inRun;
    this.score.textContent = String(score);
    this.coach.hidden = phase !== "playing" || runTime < 0.85 || runTime > 4.2;
    this.menu.classList.toggle("show", phase === "menu" || phase === "dead");
    this.menu.setAttribute("aria-hidden", phase === "menu" || phase === "dead" ? "false" : "true");
    if (phase === "menu") {
      this.title.textContent = "FRAGMENTS";
      this.blurb.textContent = "";
      this.playButton.setAttribute("aria-label", "Play");
    } else if (phase === "dead") {
      this.title.textContent = "You Died!";
      this.blurb.textContent = `Score ${score}\nHigh ${highScore}`;
      this.playButton.setAttribute("aria-label", "Play again");
    }
  }
}
