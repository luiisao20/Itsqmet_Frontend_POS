import { Injectable } from '@angular/core';

type AudioContextCtor = new () => AudioContext;

/**
 * Plays a short notification chime generated with the Web Audio API (no audio asset).
 * Every failure is swallowed: browsers may block audio until the user interacts with the page.
 */
@Injectable({
  providedIn: 'root',
})
export class NotificationSoundService {
  private context: AudioContext | null = null;

  play(): void {
    try {
      const ctx = this.getContext();
      if (!ctx) {
        return;
      }
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => undefined);
      }

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(660, now);
      osc.frequency.exponentialRampToValueAtTime(990, now + 0.12);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.5);
    } catch {
      // Audio blocked or unsupported: notifications still work without sound.
    }
  }

  private getContext(): AudioContext | null {
    if (this.context) {
      return this.context;
    }
    const w = window as unknown as {
      AudioContext?: AudioContextCtor;
      webkitAudioContext?: AudioContextCtor;
    };
    const Ctor = w.AudioContext ?? w.webkitAudioContext;
    if (!Ctor) {
      return null;
    }
    this.context = new Ctor();
    return this.context;
  }
}
