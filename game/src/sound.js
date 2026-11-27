// Synthesised sound: every effect is a few oscillators through one gain
// node, so the game needs no audio files and no network. Everything is
// guarded, so a browser with no audio (or a headless screenshot run) just
// stays silent instead of throwing.

function tone(context, master, frequency, startAt, duration, type, volume, slideTo) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startAt);
  if (slideTo) oscillator.frequency.exponentialRampToValueAtTime(slideTo, startAt + duration);
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(volume, startAt + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
  oscillator.connect(gain);
  gain.connect(master);
  oscillator.start(startAt);
  oscillator.stop(startAt + duration + 0.05);
}

export function createSound() {
  let context = null;
  let master = null;
  let muted = false;
  let enabled = true;

  function ensure() {
    if (!enabled || muted || typeof window === 'undefined') return null;
    try {
      if (!context) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return null;
        context = new AudioContext();
        master = context.createGain();
        master.gain.value = 0.35;
        master.connect(context.destination);
      }
      if (context.state === 'suspended') void context.resume();
      return { context, master };
    } catch {
      return null;
    }
  }

  function play(notes) {
    const audio = ensure();
    if (!audio) return;
    const now = audio.context.currentTime + 0.02;
    for (const note of notes) {
      tone(audio.context, audio.master, note.frequency, now + note.at, note.duration, note.type, note.volume, note.slideTo);
    }
  }

  return {
    /** Screenshots run silent; the live game enables sound on first input. */
    setEnabled(value) {
      enabled = value;
    },
    toggleMute() {
      muted = !muted;
      return muted;
    },
    gobble() {
      play([
        { frequency: 520, at: 0, duration: 0.09, type: 'square', volume: 0.12, slideTo: 300 },
        { frequency: 420, at: 0.1, duration: 0.09, type: 'square', volume: 0.12, slideTo: 240 },
      ]);
    },
    pickup() {
      play([{ frequency: 880, at: 0, duration: 0.12, type: 'sine', volume: 0.16, slideTo: 1320 }]);
    },
    alarm() {
      play([
        { frequency: 300, at: 0, duration: 0.16, type: 'sawtooth', volume: 0.14, slideTo: 640 },
        { frequency: 300, at: 0.18, duration: 0.16, type: 'sawtooth', volume: 0.14, slideTo: 640 },
      ]);
    },
    thud() {
      play([{ frequency: 140, at: 0, duration: 0.22, type: 'triangle', volume: 0.22, slideTo: 60 }]);
    },
    win() {
      play([
        { frequency: 523, at: 0, duration: 0.16, type: 'sine', volume: 0.16 },
        { frequency: 659, at: 0.16, duration: 0.16, type: 'sine', volume: 0.16 },
        { frequency: 784, at: 0.32, duration: 0.3, type: 'sine', volume: 0.18 },
      ]);
    },
    lose() {
      play([
        { frequency: 392, at: 0, duration: 0.2, type: 'sine', volume: 0.16, slideTo: 330 },
        { frequency: 330, at: 0.22, duration: 0.2, type: 'sine', volume: 0.16, slideTo: 262 },
        { frequency: 262, at: 0.44, duration: 0.4, type: 'sine', volume: 0.16, slideTo: 196 },
      ]);
    },
  };
}
