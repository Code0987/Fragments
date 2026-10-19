const base = import.meta.env.BASE_URL;

const FILES: Record<string, string> = {
  saw: "audio/saw.mp3",
  explosion: "audio/explosion.wav",
  flame: "audio/flame.wav",
  hint: "audio/hint.wav",
};

export class AudioBus {
  muted = false;
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private buffers = new Map<string, AudioBuffer>();
  private encoded = new Map<string, ArrayBuffer>();
  private saw: AudioBufferSourceNode | null = null;
  private sawGain: GainNode | null = null;
  private music: AudioBufferSourceNode | null = null;
  private grinding = false;
  private decoded = false;

  async load(): Promise<void> {
    await Promise.all(
      Object.entries(FILES).map(async ([name, path]) => {
        const response = await fetch(`${base}${path}`);
        if (!response.ok) return;
        this.encoded.set(name, await response.arrayBuffer());
      }),
    );
  }

  unlock(): void {
    const ctx = this.ensure();
    if (ctx.state === "suspended") void ctx.resume();
    if (!this.decoded) {
      this.decoded = true;
      void this.decodeAll();
    }
  }

  private ensure(): AudioContext {
    if (!this.ctx) {
      const ctx = new AudioContext();
      const master = ctx.createGain();
      master.gain.value = this.muted ? 0 : 1;
      master.connect(ctx.destination);
      this.ctx = ctx;
      this.master = master;
    }
    return this.ctx;
  }

  private async decodeAll(): Promise<void> {
    const ctx = this.ctx;
    if (!ctx) return;
    await Promise.all(
      [...this.encoded.entries()].map(async ([name, data]) => {
        try {
          const buffer = await ctx.decodeAudioData(data.slice(0));
          this.buffers.set(name, buffer);
        } catch {
          // Skip a clip the browser cannot decode.
        }
      }),
    );
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.master) this.master.gain.value = muted ? 0 : 1;
    if (muted) {
      this.haltSaw();
      this.grinding = false;
    }
  }

  play(name: string, volume = 1): void {
    const buffer = this.buffers.get(name);
    const ctx = this.ctx;
    if (!buffer || !ctx || !this.master || this.muted) return;
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    gain.gain.value = volume;
    source.buffer = buffer;
    source.connect(gain);
    gain.connect(this.master);
    source.start();
  }

  playMusic(): void {
    const buffer = this.buffers.get("music");
    const ctx = this.ctx;
    if (!buffer || !ctx || !this.master || this.music) return;
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    gain.gain.value = 0.45;
    source.buffer = buffer;
    source.loop = true;
    source.connect(gain);
    gain.connect(this.master);
    source.start();
    this.music = source;
  }

  setGrinding(active: boolean): void {
    if (active === this.grinding) return;
    this.grinding = active;
    if (!active || this.muted) {
      this.haltSaw();
      return;
    }
    const buffer = this.buffers.get("saw");
    const ctx = this.ctx;
    if (!buffer || !ctx || !this.master) {
      this.grinding = false;
      return;
    }
    this.haltSaw();
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    gain.gain.value = 0.55;
    source.buffer = buffer;
    source.loop = true;
    source.connect(gain);
    gain.connect(this.master);
    source.start();
    this.saw = source;
    this.sawGain = gain;
    this.grinding = true;
  }

  private haltSaw(): void {
    if (!this.saw) return;
    try {
      this.saw.stop();
    } catch {
      // The source can already be stopped.
    }
    this.saw.disconnect();
    this.sawGain?.disconnect();
    this.saw = null;
    this.sawGain = null;
  }
}
