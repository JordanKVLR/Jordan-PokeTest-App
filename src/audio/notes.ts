/**
 * The score notation the game's music is written in, and the arithmetic of pitch.
 *
 * A part is a string of space-separated tokens, each one step-counted:
 *   "A4:2"          one note, two steps long
 *   "D3+F#3+A3:8"   a chord (notes joined by +), eight steps
 *   "r:4"           a rest
 *   "A4"            a note with no length given lasts one step
 * A step is whatever the track says it is — an eighth note in most of them. Everything here is
 * pure so the whole score can be checked by tests without a browser.
 */

export interface NoteEvent {
  /** Step the note starts on, from the top of the part. */
  step: number;
  /** Length in steps. */
  length: number;
  /** MIDI note numbers; more than one for a chord. */
  midi: number[];
}

const NOTE_OFFSETS: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** "C4" → 60, "F#3" → 54, "Bb5" → 82. Throws on anything else so a typo in a score fails loudly. */
export function noteToMidi(name: string): number {
  const match = /^([A-G])([#b]?)(-?\d)$/.exec(name.trim());
  if (!match) throw new Error(`Not a note: "${name}"`);
  const [, letter, accidental, octave] = match;
  const shift = accidental === "#" ? 1 : accidental === "b" ? -1 : 0;
  return 12 * (Number(octave) + 1) + NOTE_OFFSETS[letter] + shift;
}

/** Equal temperament, A4 = 440 Hz. */
export function midiToFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/** Parses a part string into timed events. Rests take up time but produce no event. */
export function parsePart(part: string): { events: NoteEvent[]; length: number } {
  const events: NoteEvent[] = [];
  let step = 0;
  for (const token of part.trim().split(/\s+/).filter(Boolean)) {
    const [pitch, lengthText] = token.split(":");
    const length = lengthText === undefined ? 1 : Number(lengthText);
    if (!Number.isFinite(length) || length <= 0) throw new Error(`Bad length in "${token}"`);
    if (pitch !== "r") events.push({ step, length, midi: pitch.split("+").map(noteToMidi) });
    step += length;
  }
  return { events, length: step };
}

/** Chord qualities, as semitones above the root. */
const QUALITIES: Record<string, number[]> = {
  "": [0, 4, 7],
  m: [0, 3, 7],
  "7": [0, 4, 7, 10],
  m7: [0, 3, 7, 10],
  maj7: [0, 4, 7, 11],
  sus4: [0, 5, 7],
  sus2: [0, 2, 7],
  dim: [0, 3, 6],
};

/** "F#m" at octave 3 → the MIDI notes of an F# minor triad rooted at F#3. */
export function chordNotes(symbol: string, octave: number): number[] {
  const match = /^([A-G][#b]?)(.*)$/.exec(symbol);
  if (!match || !(match[2] in QUALITIES)) throw new Error(`Not a chord: "${symbol}"`);
  const root = noteToMidi(`${match[1]}${octave}`);
  return QUALITIES[match[2]].map((interval) => root + interval);
}

function midiToName(midi: number): string {
  const names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  return `${names[midi % 12]}${Math.floor(midi / 12) - 1}`;
}

/**
 * Builds an accompaniment part from a chord chart. `pattern` picks chord tones by index (0 is
 * the root; indices past the triad climb into the next octave), one per step, repeated to fill
 * each chord's length. -1 in the pattern is a rest.
 */
export function arpeggiate(chords: string[], octave: number, pattern: number[], stepsPerChord: number): string {
  const tokens: string[] = [];
  for (const symbol of chords) {
    const tones = chordNotes(symbol, octave);
    for (let i = 0; i < stepsPerChord; i++) {
      const index = pattern[i % pattern.length];
      if (index < 0) {
        tokens.push("r:1");
        continue;
      }
      const tone = tones[index % tones.length] + 12 * Math.floor(index / tones.length);
      tokens.push(`${midiToName(tone)}:1`);
    }
  }
  return tokens.join(" ");
}

/** One held chord per bar (or per `stepsPerChord`), for pads and drones. */
export function sustain(chords: string[], octave: number, stepsPerChord: number): string {
  return chords.map((symbol) => `${chordNotes(symbol, octave).map(midiToName).join("+")}:${stepsPerChord}`).join(" ");
}

/**
 * A bass line from a chord chart: each chord's root (and fifth, if `pattern` asks for it with 1),
 * placed on the steps the pattern marks. Pattern values: 0 root, 1 fifth, 2 octave, -1 rest;
 * each entry is `[step, tone, length]` within one chord.
 */
export function bassLine(chords: string[], octave: number, pattern: [number, number, number][], stepsPerChord: number): string {
  const tokens: string[] = [];
  for (const symbol of chords) {
    const [root, , fifth] = chordNotes(symbol, octave);
    let at = 0;
    for (const [step, tone, length] of pattern) {
      if (step > at) tokens.push(`r:${step - at}`);
      const midi = tone === 1 ? fifth : tone === 2 ? root + 12 : root;
      tokens.push(`${midiToName(midi)}:${length}`);
      at = step + length;
    }
    if (at < stepsPerChord) tokens.push(`r:${stepsPerChord - at}`);
  }
  return tokens.join(" ");
}

/** Repeats a one-bar drum string `times` times. */
export function repeat(part: string, times: number): string {
  return Array.from({ length: times }, () => part).join(" ");
}
