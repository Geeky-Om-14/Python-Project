/**
 * Audio Alarm Synthesizer using Web Audio API
 * Generates immediate, crisp auditory warnings for micro-sleep and blink events.
 */

class AudioAlarmService {
  private ctx: AudioContext | null = null;
  private isAlarmRunning = false;
  private alarmOscillator: OscillatorNode | null = null;
  private alarmGain: GainNode | null = null;
  private lfo: OscillatorNode | null = null;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public startCriticalAlarm(volume: number = 0.8, soundType: 'siren' | 'chime' | 'pulse' = 'siren') {
    this.initContext();
    if (!this.ctx || this.isAlarmRunning) return;

    try {
      this.isAlarmRunning = true;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      if (soundType === 'siren') {
        // High-urgency penetrating frequency sweep: 880Hz -> 1400Hz
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, now);

        // Low frequency modulator for fast pulsing warble
        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();
        lfo.type = 'square';
        lfo.frequency.setValueAtTime(6, now); // 6 pulses per second
        lfoGain.gain.setValueAtTime(450, now);

        lfo.connect(osc.frequency);
        lfo.start(now);
        this.lfo = lfo;

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.exponentialRampToValueAtTime(Math.max(0.01, volume * 0.9), now + 0.05);
      } else if (soundType === 'pulse') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(1050, now);

        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();
        lfo.type = 'square';
        lfo.frequency.setValueAtTime(8, now);
        lfoGain.gain.setValueAtTime(0.5, now);

        gain.gain.setValueAtTime(Math.max(0.01, volume * 0.85), now);
        this.lfo = lfo;
      } else {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(660, now);
        gain.gain.setValueAtTime(Math.max(0.01, volume * 0.7), now);
      }

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);

      this.alarmOscillator = osc;
      this.alarmGain = gain;
    } catch (e) {
      console.warn('Audio alarm could not start:', e);
      this.isAlarmRunning = false;
    }
  }

  public stopCriticalAlarm() {
    if (!this.isAlarmRunning) return;
    try {
      if (this.alarmGain && this.ctx) {
        const now = this.ctx.currentTime;
        this.alarmGain.gain.linearRampToValueAtTime(0.001, now + 0.05);
      }
      setTimeout(() => {
        try {
          if (this.alarmOscillator) {
            this.alarmOscillator.stop();
            this.alarmOscillator.disconnect();
            this.alarmOscillator = null;
          }
          if (this.lfo) {
            this.lfo.stop();
            this.lfo.disconnect();
            this.lfo = null;
          }
          if (this.alarmGain) {
            this.alarmGain.disconnect();
            this.alarmGain = null;
          }
        } catch {
          // ignore cleanup errors
        }
        this.isAlarmRunning = false;
      }, 60);
    } catch {
      this.isAlarmRunning = false;
    }
  }

  public playWarningChime(volume: number = 0.6) {
    this.initContext();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';

      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.frequency.setValueAtTime(880, now + 0.12); // A5

      osc2.frequency.setValueAtTime(587.33 * 2, now);
      osc2.frequency.setValueAtTime(880 * 2, now + 0.12);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(volume * 0.6, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.45);
      osc2.stop(now + 0.45);
    } catch (e) {
      console.warn('Warning chime error:', e);
    }
  }

  public playInstantBlinkAlert(volume: number = 0.7) {
    this.initContext();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // Sharp urgent staccato alert for immediate blink detection feedback
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1250, now);
      osc.frequency.exponentialRampToValueAtTime(850, now + 0.08);

      gain.gain.setValueAtTime(volume * 0.8, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.11);
    } catch {
      // ignore
    }
  }

  public testAudioBeep(volume: number = 0.7, soundType: 'siren' | 'chime' | 'pulse' = 'siren') {
    this.initContext();
    if (soundType === 'chime') {
      this.playWarningChime(volume);
    } else {
      this.startCriticalAlarm(volume, soundType);
      setTimeout(() => {
        this.stopCriticalAlarm();
      }, 700);
    }
  }

  public isAlarmActive(): boolean {
    return this.isAlarmRunning;
  }
}

export const audioAlarm = new AudioAlarmService();
