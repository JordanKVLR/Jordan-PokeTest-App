import { audio, playNote, quietly, sfxEnabled } from "./engine";
import { noteToMidi } from "./notes";
import type { TypeName } from "../data/schemas";

/**
 * Every sound effect in the game, each a small recipe of tones and filtered noise. They all go
 * through the effects bus, so the Sound effects volume setting governs them together.
 */

interface ToneSpec {
  type?: OscillatorType;
  freq: number;
  /** Glide to this frequency over the sound. */
  to?: number;
  at?: number;
  dur: number;
  gain?: number;
  attack?: number;
  pan?: number;
  detune?: number;
  /** Frequency wobble: [rate Hz, depth Hz]. */
  wobble?: [number, number];
}

interface NoiseSpec {
  filter?: BiquadFilterType;
  freq: number;
  to?: number;
  q?: number;
  at?: number;
  dur: number;
  gain?: number;
  attack?: number;
  pan?: number;
}

/** A loudness correction for the sound being built, so thin noise sweeps and solid thuds come out even. */
let trim = 1;
function trimmed(amount: number, build: () => void) {
  trim = amount;
  try {
    build();
  } finally {
    trim = 1;
  }
}

/** Wraps every effect in a set so no sound can throw into the game. */
function guardAll<T extends Record<string, (...args: never[]) => unknown>>(effects: T): T {
  const safe = {} as Record<string, unknown>;
  for (const [name, fn] of Object.entries(effects)) safe[name] = quietly(fn as (...args: unknown[]) => unknown);
  return safe as T;
}

function out(pan = 0, wet = 0.15): { context: AudioContext; node: AudioNode; now: number } | null {
  if (!sfxEnabled()) return null;
  const live = audio();
  if (!live) return null;
  const { ctx, buses } = live;
  const gain = ctx.createGain();
  let node: AudioNode = gain;
  if (pan && typeof ctx.createStereoPanner === "function") {
    const p = ctx.createStereoPanner();
    p.pan.value = pan;
    gain.connect(p).connect(buses.sfx);
  } else {
    gain.connect(buses.sfx);
  }
  if (wet > 0) {
    const send = ctx.createGain();
    send.gain.value = wet;
    gain.connect(send).connect(buses.reverbSend);
  }
  node = gain;
  return { context: ctx, node, now: ctx.currentTime + 0.005 };
}

function tone(spec: ToneSpec, wet?: number) {
  const o = out(spec.pan, wet);
  if (!o) return;
  const { context, node, now } = o;
  const start = now + (spec.at ?? 0);
  const end = start + spec.dur;
  const osc = context.createOscillator();
  osc.type = spec.type ?? "sine";
  osc.frequency.setValueAtTime(spec.freq, start);
  if (spec.to) osc.frequency.exponentialRampToValueAtTime(spec.to, end);
  if (spec.detune) osc.detune.value = spec.detune;
  if (spec.wobble) {
    const lfo = context.createOscillator();
    lfo.frequency.value = spec.wobble[0];
    const depth = context.createGain();
    depth.gain.value = spec.wobble[1];
    lfo.connect(depth).connect(osc.frequency);
    lfo.start(start);
    lfo.stop(end + 0.05);
  }
  const g = context.createGain();
  const attack = spec.attack ?? 0.005;
  g.gain.setValueAtTime(0.0001, start);
  g.gain.linearRampToValueAtTime((spec.gain ?? 0.3) * trim, start + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, end);
  osc.connect(g).connect(node);
  osc.start(start);
  osc.stop(end + 0.05);
}

function noise(spec: NoiseSpec, wet?: number) {
  const o = out(spec.pan, wet);
  const live = audio();
  if (!o || !live) return;
  const { context, node, now } = o;
  const start = now + (spec.at ?? 0);
  const end = start + spec.dur;
  const source = context.createBufferSource();
  source.buffer = live.buses.noise;
  const filter = context.createBiquadFilter();
  filter.type = spec.filter ?? "bandpass";
  filter.frequency.setValueAtTime(spec.freq, start);
  if (spec.to) filter.frequency.exponentialRampToValueAtTime(spec.to, end);
  filter.Q.value = spec.q ?? 1;
  const g = context.createGain();
  const attack = spec.attack ?? 0.005;
  g.gain.setValueAtTime(0.0001, start);
  g.gain.linearRampToValueAtTime((spec.gain ?? 0.3) * trim, start + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, end);
  source.connect(filter).connect(g).connect(node);
  source.start(start, Math.random() * 1.5);
  source.stop(end + 0.05);
}

/** A few notes on one of the band's instruments, straight onto the effects bus. */
function notes(instrument: Parameters<typeof playNote>[0], names: string[], gap: number, length: number, level = 0.3, wet = 0.25) {
  const live = audio();
  if (!sfxEnabled() || !live) return;
  const now = live.ctx.currentTime + 0.01;
  names.forEach((name, i) => {
    for (const note of name.split("+")) playNote(instrument, noteToMidi(note), now + i * gap, length, level, 0, live.buses.sfx, wet);
  });
}

// ─── Interface ───────────────────────────────────────────────────────────────────────────────

export const ui = guardAll({
  /** Any button. Short and woody, so a hundred of them never grate. */
  tap: () => {
    tone({ type: "triangle", freq: 1250, to: 900, dur: 0.05, gain: 0.12 }, 0);
    noise({ filter: "highpass", freq: 3000, dur: 0.02, gain: 0.04 }, 0);
  },
  back: () => tone({ type: "triangle", freq: 900, to: 560, dur: 0.08, gain: 0.12 }, 0),
  toggle: () => {
    tone({ type: "sine", freq: 880, dur: 0.05, gain: 0.12 }, 0);
    tone({ type: "sine", freq: 1320, at: 0.04, dur: 0.06, gain: 0.1 }, 0);
  },
  blocked: () => tone({ type: "square", freq: 150, dur: 0.12, gain: 0.06 }, 0),
  /** A popup message arriving. */
  message: () => tone({ type: "sine", freq: 1560, dur: 0.05, gain: 0.05 }, 0.1),
  open: () => trimmed(2.5, () => noise({ filter: "bandpass", freq: 900, to: 2600, q: 0.8, dur: 0.16, gain: 0.08 }, 0.05)),
  close: () => trimmed(2.2, () => noise({ filter: "bandpass", freq: 2600, to: 800, q: 0.8, dur: 0.14, gain: 0.07 }, 0.05)),
  /** Gold changing hands. */
  coin: () => notes("bell", ["B5", "E6"], 0.07, 0.2, 0.22, 0.2),
  /** A briefing unrolled: paper and a soft bell. */
  scroll: () => {
    noise({ filter: "bandpass", freq: 1800, to: 3200, q: 0.6, dur: 0.3, gain: 0.07, attack: 0.08 }, 0.1);
    notes("marimba", ["G5", "D6"], 0.1, 0.3, 0.2);
  },
  /** Picking something up, choosing a starter: a warm little rise. */
  confirm: () => notes("marimba", ["C5", "G5", "C6"], 0.06, 0.2, 0.25),
});

// ─── Overworld ───────────────────────────────────────────────────────────────────────────────

export const world = guardAll({
  /** Walking into a wall or a tree. */
  bump: () => tone({ type: "sine", freq: 110, to: 70, dur: 0.1, gain: 0.25 }, 0),
  /** The grass rustles and something leaps out. */
  encounter: () => {
    noise({ filter: "highpass", freq: 2000, to: 6000, dur: 0.35, gain: 0.18, attack: 0.1 }, 0.2);
    tone({ type: "sawtooth", freq: 220, to: 880, dur: 0.35, gain: 0.08 }, 0.2);
    notes("brass", ["E4+B4", "F4+C5"], 0.12, 0.25, 0.28, 0.3);
  },
  /** A trainer has seen you. */
  spotted: () => {
    notes("brass", ["A5", "A5"], 0.08, 0.1, 0.25, 0.2);
    tone({ type: "square", freq: 1760, at: 0.2, dur: 0.12, gain: 0.06 }, 0.2);
  },
  /** Setting foot in a stage for the first time. */
  newStage: () => notes("bell", ["G5", "C6", "E6", "G6"], 0.09, 0.4, 0.2, 0.4),
  step: () => noise({ filter: "lowpass", freq: 600, dur: 0.05, gain: 0.05 }, 0),
});

// ─── Battle ──────────────────────────────────────────────────────────────────────────────────

type AttackRecipe = (pan: number) => void;

/** How each type sounds when it's thrown. `pan` points from the attacker to the target. */
const ATTACKS: Record<TypeName, AttackRecipe> = {
  Normal: (pan) => {
    noise({ filter: "bandpass", freq: 700, to: 2400, q: 0.8, dur: 0.22, gain: 0.18, attack: 0.05, pan });
  },
  Fire: (pan) => {
    noise({ filter: "lowpass", freq: 300, to: 3500, q: 0.7, dur: 0.5, gain: 0.3, attack: 0.12, pan }, 0.25);
    for (let i = 0; i < 6; i++) noise({ filter: "highpass", freq: 3000, at: 0.05 + i * 0.06 + Math.random() * 0.03, dur: 0.02, gain: 0.08, pan });
  },
  Water: (pan) => {
    noise({ filter: "bandpass", freq: 2200, to: 400, q: 1.2, dur: 0.45, gain: 0.25, attack: 0.03, pan }, 0.3);
    for (let i = 0; i < 5; i++) {
      const f = 350 + Math.random() * 500;
      tone({ freq: f, to: f * 1.8, at: 0.08 + i * 0.06, dur: 0.06, gain: 0.1, pan });
    }
  },
  Grass: (pan) => {
    noise({ filter: "highpass", freq: 3500, dur: 0.4, gain: 0.14, attack: 0.1, pan }, 0.1);
    noise({ filter: "bandpass", freq: 1200, to: 4000, q: 2, at: 0.1, dur: 0.12, gain: 0.16, pan });
  },
  Electric: (pan) => {
    for (let i = 0; i < 8; i++) {
      tone({ type: "square", freq: 600 + Math.random() * 1400, at: i * 0.035, dur: 0.035, gain: 0.07, pan }, 0.05);
    }
    noise({ filter: "highpass", freq: 5000, dur: 0.3, gain: 0.12, pan });
  },
  Ice: (pan) => {
    [2093, 2637, 3136, 3951, 3322].forEach((f, i) => tone({ freq: f, at: i * 0.04, dur: 0.5, gain: 0.07, pan }, 0.5));
    noise({ filter: "highpass", freq: 6000, to: 9000, dur: 0.3, gain: 0.08, pan }, 0.3);
  },
  Fighting: (pan) => {
    for (const at of [0, 0.12]) {
      tone({ freq: 160, to: 60, at, dur: 0.12, gain: 0.35, pan }, 0);
      noise({ filter: "lowpass", freq: 1500, at, dur: 0.06, gain: 0.2, pan }, 0);
    }
  },
  Poison: (pan) => {
    for (let i = 0; i < 5; i++) tone({ freq: 180 + i * 40, to: 420 + i * 60, at: i * 0.07, dur: 0.08, gain: 0.14, pan }, 0.2);
  },
  Ground: (pan) => {
    noise({ filter: "lowpass", freq: 250, to: 120, dur: 0.7, gain: 0.45, attack: 0.08, pan }, 0.2);
    tone({ freq: 55, to: 38, dur: 0.6, gain: 0.3, attack: 0.05 }, 0);
  },
  Flying: (pan) => {
    noise({ filter: "bandpass", freq: 700, to: 2600, q: 2.5, dur: 0.25, gain: 0.2, attack: 0.08, pan }, 0.2);
    noise({ filter: "bandpass", freq: 2600, to: 600, q: 2.5, at: 0.25, dur: 0.25, gain: 0.16, pan }, 0.2);
  },
  Psychic: (pan) => {
    tone({ freq: 440, to: 880, dur: 0.55, gain: 0.14, attack: 0.1, wobble: [9, 60], pan }, 0.5);
    tone({ freq: 660, to: 1320, dur: 0.55, gain: 0.08, attack: 0.15, wobble: [7, 90], pan }, 0.5);
  },
  Bug: (pan) => {
    tone({ type: "sawtooth", freq: 240, to: 300, dur: 0.4, gain: 0.08, wobble: [38, 30], pan }, 0.05);
    noise({ filter: "bandpass", freq: 3000, q: 4, dur: 0.35, gain: 0.08, pan });
  },
  Rock: (pan) => {
    for (let i = 0; i < 4; i++) noise({ filter: "lowpass", freq: 900 - i * 120, at: i * 0.06, dur: 0.09, gain: 0.3, pan }, 0.1);
    tone({ freq: 120, to: 50, at: 0.2, dur: 0.2, gain: 0.3, pan }, 0);
  },
  Ghost: (pan) => {
    tone({ freq: 900, to: 280, dur: 0.7, gain: 0.12, attack: 0.15, wobble: [5, 25], pan }, 0.6);
    tone({ freq: 910, to: 285, dur: 0.7, gain: 0.08, attack: 0.2, detune: 30, pan }, 0.6);
  },
  Dragon: (pan) => {
    tone({ type: "sawtooth", freq: 70, to: 110, dur: 0.6, gain: 0.2, attack: 0.08, wobble: [22, 12], pan }, 0.3);
    noise({ filter: "lowpass", freq: 500, to: 1500, q: 3, dur: 0.6, gain: 0.25, attack: 0.1, pan }, 0.3);
  },
  Dark: (pan) => {
    noise({ filter: "lowpass", freq: 200, to: 1200, dur: 0.35, gain: 0.25, attack: 0.3, pan }, 0.3);
    tone({ freq: 220, to: 55, at: 0.3, dur: 0.3, gain: 0.25, pan }, 0.2);
  },
  Steel: (pan) => {
    [1, 2.41, 3.83, 5.14].forEach((ratio, i) => tone({ freq: 560 * ratio, dur: 0.7 - i * 0.12, gain: 0.12 / (i + 1), pan }, 0.4));
    noise({ filter: "highpass", freq: 4000, dur: 0.05, gain: 0.15, pan }, 0);
  },
  Fairy: (pan) => {
    ["C6", "E6", "G6", "C7", "E7"].forEach((name, i) =>
      tone({ freq: 440 * Math.pow(2, (noteToMidi(name) - 69) / 12), at: i * 0.05, dur: 0.35, gain: 0.08, pan }, 0.5)
    );
  },
};

/** Measured in the browser: brings every type's attack to roughly the same peak. */
const ATTACK_TRIM: Partial<Record<TypeName, number>> = {
  Normal: 3,
  Flying: 3.5,
  Bug: 2.2,
  Fairy: 1.8,
  Fire: 1.7,
  Water: 1.5,
  Poison: 1.5,
  Ice: 1.4,
  Electric: 1.2,
  Ground: 0.6,
  Fighting: 0.65,
};

export const battle = guardAll({
  /** A move being thrown. Status moves shimmer instead of striking. */
  attack: (type: TypeName, category: "physical" | "special" | "status", fromPlayer: boolean) => {
    const pan = fromPlayer ? 0.3 : -0.3;
    if (category === "status") {
      tone({ freq: 523, to: 1046, dur: 0.35, gain: 0.1, attack: 0.08, pan }, 0.4);
      tone({ freq: 784, to: 1568, at: 0.08, dur: 0.35, gain: 0.07, attack: 0.08, pan }, 0.4);
      return;
    }
    trimmed(ATTACK_TRIM[type] ?? 1, () => ATTACKS[type](pan));
  },
  /** A move landing. Super effective cracks bright; resisted thuds dull; immune barely taps. */
  hit: (effect: "normal" | "super" | "weak" | "none", crit: boolean, onPlayer: boolean) => {
    const pan = onPlayer ? -0.35 : 0.35;
    if (effect === "none") {
      tone({ type: "triangle", freq: 300, to: 250, dur: 0.12, gain: 0.08, pan }, 0);
      return;
    }
    const weight = effect === "super" ? 1.3 : effect === "weak" ? 0.6 : 1;
    tone({ freq: 140, to: 48, dur: 0.18, gain: 0.4 * weight, pan }, 0.05);
    noise({ filter: "lowpass", freq: effect === "weak" ? 700 : 2200, dur: 0.1, gain: 0.25 * weight, pan }, 0.05);
    if (effect === "super") {
      noise({ filter: "highpass", freq: 3500, dur: 0.12, gain: 0.18, pan }, 0.2);
      tone({ type: "square", freq: 1760, at: 0.02, dur: 0.1, gain: 0.05, pan }, 0.2);
    }
    if (crit) {
      noise({ filter: "bandpass", freq: 5000, q: 3, at: 0.04, dur: 0.08, gain: 0.2, pan }, 0.1);
      tone({ type: "triangle", freq: 2400, to: 1800, at: 0.04, dur: 0.12, gain: 0.1, pan }, 0.3);
    }
  },
  miss: (fromPlayer: boolean) =>
    trimmed(3, () => noise({ filter: "bandpass", freq: 1800, to: 500, q: 1.5, dur: 0.3, gain: 0.14, attack: 0.05, pan: fromPlayer ? 0.4 : -0.4 }, 0.2)),
  faint: (isPlayer: boolean) => {
    const pan = isPlayer ? -0.3 : 0.3;
    tone({ type: "triangle", freq: 660, to: 110, dur: 0.8, gain: 0.18, pan }, 0.3);
    tone({ freq: 90, to: 40, at: 0.6, dur: 0.3, gain: 0.3, pan }, 0.1);
  },
  statUp: () => notes("bell", ["C5", "E5", "G5", "C6"], 0.05, 0.2, 0.16, 0.3),
  statDown: () => notes("bell", ["C6", "A5", "F5", "D5"], 0.05, 0.2, 0.14, 0.3),
  /** The Crux Aura igniting: a rising roar and a chord from the temple stones. */
  crux: () => {
    noise({ filter: "bandpass", freq: 200, to: 3000, q: 1.5, dur: 0.9, gain: 0.3, attack: 0.3 }, 0.4);
    tone({ type: "sawtooth", freq: 55, to: 110, dur: 0.9, gain: 0.12, attack: 0.2 }, 0.4);
    notes("brass", ["D4+A4+D5"], 0, 0.8, 0.25, 0.5);
  },
  /** Sending a creature out. */
  switchIn: () => {
    noise({ filter: "bandpass", freq: 600, to: 3000, dur: 0.2, gain: 0.14, attack: 0.03 }, 0.2);
    notes("marimba", ["G4", "D5"], 0.08, 0.2, 0.22);
  },
  flee: () => trimmed(3, () => {
    for (let i = 0; i < 4; i++) noise({ filter: "lowpass", freq: 700, at: i * 0.09, dur: 0.05, gain: 0.12 }, 0);
    noise({ filter: "bandpass", freq: 1200, to: 300, at: 0.3, dur: 0.3, gain: 0.1 }, 0.2);
  }),
  /** The trap arcing through the air. */
  throwTrap: () => trimmed(3.5, () => noise({ filter: "bandpass", freq: 500, to: 2500, q: 2, dur: 0.4, gain: 0.18, attack: 0.1, pan: 0.2 }, 0.2)),
  /** It lands on the creature and snaps shut. */
  trapShut: () => {
    tone({ type: "square", freq: 1200, to: 600, dur: 0.05, gain: 0.1, pan: 0.3 }, 0.1);
    tone({ freq: 200, to: 90, dur: 0.1, gain: 0.25, pan: 0.3 }, 0.1);
  },
  /** One nervous wobble of the trap. */
  wobble: () => {
    tone({ type: "triangle", freq: 420, to: 380, dur: 0.07, gain: 0.12, pan: 0.3 }, 0.1);
    tone({ type: "triangle", freq: 380, at: 0.1, dur: 0.07, gain: 0.1, pan: 0.3 }, 0.1);
  },
  /** It holds — click. */
  caughtClick: () => {
    tone({ type: "square", freq: 2000, dur: 0.03, gain: 0.12, pan: 0.3 }, 0.2);
    tone({ type: "square", freq: 3000, at: 0.05, dur: 0.03, gain: 0.1, pan: 0.3 }, 0.2);
  },
  /** It bursts free. */
  breakFree: () => {
    noise({ filter: "highpass", freq: 1500, dur: 0.25, gain: 0.25, pan: 0.3 }, 0.3);
    tone({ freq: 300, to: 900, dur: 0.2, gain: 0.12, pan: 0.3 }, 0.2);
  },
  heal: () => {
    notes("bell", ["E6", "G6", "B6", "E7"], 0.06, 0.3, 0.14, 0.5);
    noise({ filter: "highpass", freq: 6000, dur: 0.5, gain: 0.05, attack: 0.1 }, 0.5);
  },
  /** The elemental curtain sweeping in before a trainer fight, coloured by the trainer's type. */
  transition: (type: TypeName) => {
    noise({ filter: "bandpass", freq: 300, to: 5000, q: 1, dur: 0.6, gain: 0.2, attack: 0.3 }, 0.3);
    setTimeout(() => trimmed(ATTACK_TRIM[type] ?? 1, () => ATTACKS[type](0)), 450);
  },
});
