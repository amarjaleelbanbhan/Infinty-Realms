// ============================================================
// Dynamic Web Audio Soundtrack & Music Engine
// Generates procedural ambient, combat, dungeon & boss audio
// ============================================================

export type MusicTrack = 'explore' | 'combat' | 'dungeon' | 'boss';

export class SoundtrackSystem {
  private ctx: AudioContext | null = null;
  private currentTrack: MusicTrack = 'explore';
  private isPlaying = false;
  private masterGain: GainNode | null = null;
  private loopInterval: number | null = null;

  private init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    } catch (e) {
      console.warn('[Soundtrack] Web Audio API unavailable:', e);
    }
  }

  playTrack(track: MusicTrack) {
    this.init();
    if (this.currentTrack === track && this.isPlaying) return;
    this.currentTrack = track;
    this.stopTrack();

    this.isPlaying = true;
    if (this.ctx && this.masterGain) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      this.startProceduralLoop(track);
    }
  }

  stopTrack() {
    if (this.loopInterval) {
      window.clearInterval(this.loopInterval);
      this.loopInterval = null;
    }
    this.isPlaying = false;
  }

  setVolume(volume: number) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, volume * 0.2)), this.ctx.currentTime);
    }
  }

  private startProceduralLoop(track: MusicTrack) {
    const playChord = () => {
      if (!this.ctx || !this.masterGain || !this.isPlaying) return;

      const now = this.ctx.currentTime;
      let freqs: number[] = [130.81, 164.81, 196.00]; // C Major default

      if (track === 'explore') {
        // Peaceful ambient pentatonic C4-E4-G4-A4
        const chords = [
          [261.63, 329.63, 392.00],
          [220.00, 261.63, 329.63],
          [174.61, 220.00, 261.63],
          [196.00, 246.94, 293.66],
        ];
        freqs = chords[Math.floor(Math.random() * chords.length)];
      } else if (track === 'combat') {
        // Driving intense minor progression A2-C3-E3
        const chords = [
          [110.00, 130.81, 164.81],
          [98.00, 123.47, 146.83],
          [87.31, 110.00, 130.81],
        ];
        freqs = chords[Math.floor(Math.random() * chords.length)];
      } else if (track === 'dungeon') {
        // Dark, low eerie dissonant chords
        const chords = [
          [65.41, 77.78, 98.00],
          [73.42, 87.31, 110.00],
        ];
        freqs = chords[Math.floor(Math.random() * chords.length)];
      } else if (track === 'boss') {
        // Heavy ominous low brass chords
        freqs = [55.00, 82.41, 110.00, 138.59];
      }

      freqs.forEach((freq) => {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = track === 'combat' || track === 'boss' ? 'sawtooth' : 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.08, now + 0.8);
        gain.gain.exponentialRampToValueAtTime(0.001, now + (track === 'combat' ? 1.5 : 3.5));

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + (track === 'combat' ? 1.6 : 3.6));
      });
    };

    playChord();
    const intervalMs = track === 'combat' ? 1200 : track === 'boss' ? 1000 : 4000;
    this.loopInterval = window.setInterval(playChord, intervalMs);
  }
}

export const soundtrackSystem = new SoundtrackSystem();
