import { arpeggiate, bassLine, parsePart, repeat, sustain } from "./notes";

/**
 * The game's score. Every piece is written for a small Mediterranean folk band — a plucked
 * guitar in the manner of għana, a wooden flute, the reedy drone of the żaqq (the Maltese
 * bagpipe), the tanbur frame drum and a tambourine — with brass and bells brought in for the
 * fanfares. All of it is synthesised live (see engine.ts); nothing here is a recording.
 *
 * Notation is described in notes.ts. Drum lines are one character per step: "x" a hit, "X" an
 * accented hit, "." silence; a drum line shorter than the track simply repeats.
 */

export type InstrumentId =
  | "guitar" // plucked string (Karplus–Strong)
  | "flute" // breathy wooden flute with vibrato
  | "reed" // accordion / reed lead
  | "zaqq" // bagpipe drone and chanter
  | "brass" // fanfare brass
  | "bell" // glockenspiel
  | "marimba" // soft mallet
  | "pad" // warm sustained strings
  | "bass" // plucked bass
  | "lead"; // bright battle lead

export type DrumVoice = "kick" | "snare" | "hat" | "tambourine" | "dum" | "tek" | "crash" | "shaker";

export interface Part {
  instrument: InstrumentId;
  notes: string;
  gain: number;
  /** Stereo position, -1 left to 1 right. */
  pan?: number;
}

export interface DrumPart {
  voice: DrumVoice;
  pattern: string;
  gain: number;
}

export interface Track {
  id: TrackId;
  bpm: number;
  /** How many steps make one beat: 2 for straight eighths, 3 for a lilting 6/8. */
  stepsPerBeat: number;
  /** Loops forever if true; plays once and stops (a jingle) if false. */
  loop: boolean;
  /** Push every other step late by this fraction of a step, for a lazy folk swing. */
  swing?: number;
  parts: Part[];
  drums?: DrumPart[];
}

export type TrackId =
  | "title"
  | "overworld"
  | "harbour"
  | "bastions"
  | "battleWild"
  | "battleTrainer"
  | "battleGym"
  | "evolution"
  | "finale"
  | "victory"
  | "caught"
  | "levelUp"
  | "medal"
  | "blackout"
  | "heal";

// ─── Title: "A Maltese Tale" ────────────────────────────────────────────────────────────────
// D major, unhurried. A guitar picks under a flute tune like the sun coming up over Dingli.

const TITLE_CHORDS = ["D", "Bm", "G", "A", "D", "Bm", "G", "A", "G", "A", "F#m", "Bm", "G", "A", "D", "D"];

const title: Track = {
  id: "title",
  bpm: 84,
  stepsPerBeat: 2,
  loop: true,
  swing: 0.08,
  parts: [
    {
      instrument: "flute",
      gain: 0.5,
      pan: 0.15,
      notes: [
        "A4:3 F#4:1 A4:2 D5:2", "C#5:2 B4:2 A4:2 F#4:2", "G4:3 A4:1 B4:2 D5:2", "C#5:4 A4:4",
        "A4:3 F#4:1 A4:2 D5:2", "E5:2 D5:2 C#5:2 B4:2", "A4:2 B4:2 G4:2 E4:2", "E4:2 F#4:2 E4:4",
        "B4:3 C#5:1 D5:2 B4:2", "C#5:3 D5:1 E5:4", "F#5:3 E5:1 C#5:2 A4:2", "D5:3 C#5:1 B4:4",
        "B4:2 D5:2 G5:2 F#5:2", "E5:2 D5:2 C#5:2 E5:2", "D5:6 r:2", "r:6 E4:1 F#4:1",
      ].join(" "),
    },
    { instrument: "guitar", gain: 0.42, pan: -0.25, notes: arpeggiate(TITLE_CHORDS, 3, [0, 1, 2, 4, 5, 4, 2, 1], 8) },
    { instrument: "pad", gain: 0.14, notes: sustain(TITLE_CHORDS, 3, 8) },
    { instrument: "bass", gain: 0.4, notes: bassLine(TITLE_CHORDS, 2, [[0, 0, 4], [4, 1, 4]], 8) },
  ],
  drums: [
    { voice: "dum", pattern: "x.......", gain: 0.35 },
    { voice: "tek", pattern: ".....x..", gain: 0.18 },
    { voice: "shaker", pattern: "..x...x.", gain: 0.1 },
  ],
};

// ─── Overworld: "Island Roads" ──────────────────────────────────────────────────────────────
// G Mixolydian, a walking tune for the terraces and the dust roads between villages.

const ROADS_CHORDS = ["G", "F", "C", "G", "G", "F", "Am", "D", "C", "G", "Am", "Em", "C", "G", "D", "D"];

const overworld: Track = {
  id: "overworld",
  bpm: 112,
  stepsPerBeat: 2,
  loop: true,
  swing: 0.12,
  parts: [
    {
      instrument: "reed",
      gain: 0.36,
      pan: 0.1,
      notes: [
        "G4:1 B4:1 D5:2 B4:1 D5:1 G5:2", "F5:2 E5:1 D5:1 C5:2 A4:2", "G4:1 A4:1 C5:2 E5:2 D5:1 C5:1", "D5:4 B4:2 r:2",
        "G4:1 B4:1 D5:2 B4:1 D5:1 G5:2", "A5:2 G5:1 F5:1 E5:1 D5:1 C5:2", "E5:2 C5:2 A4:2 C5:2", "D5:2 E5:1 F#5:1 A5:4",
        "G5:3 E5:1 C5:2 E5:2", "D5:3 B4:1 G4:2 B4:2", "C5:2 D5:2 E5:2 A5:2", "G5:3 E5:1 D5:2 B4:2",
        "C5:1 D5:1 E5:2 G5:2 E5:2", "D5:2 B4:2 D5:2 G5:2", "F#5:2 E5:2 D5:2 C5:2", "A4:4 D5:2 F#4:2",
      ].join(" "),
    },
    // Boom-chuck: the bass on the beat, a strummed chord on the off-beat.
    { instrument: "guitar", gain: 0.3, pan: -0.3, notes: arpeggiate(ROADS_CHORDS, 3, [-1, 3, -1, 4, -1, 3, -1, 4], 8) },
    { instrument: "guitar", gain: 0.22, pan: 0.3, notes: arpeggiate(ROADS_CHORDS, 3, [-1, 1, -1, 2, -1, 1, -1, 2], 8) },
    { instrument: "bass", gain: 0.5, notes: bassLine(ROADS_CHORDS, 2, [[0, 0, 2], [2, 1, 2], [4, 0, 2], [6, 1, 2]], 8) },
  ],
  drums: [
    { voice: "dum", pattern: "x...x...", gain: 0.34 },
    { voice: "tambourine", pattern: "..x...x.", gain: 0.2 },
    { voice: "shaker", pattern: "xxxxxxxx", gain: 0.06 },
  ],
};

// ─── Harbour stages: "Luzzu" ────────────────────────────────────────────────────────────────
// A major in a rocking 6/8, for the saltpans, bays and lagoons — a painted boat on the swell.

const LUZZU_CHORDS = ["A", "D", "A", "E", "A", "D", "E", "A", "F#m", "D", "A", "E", "F#m", "D", "E", "A"];

const harbour: Track = {
  id: "harbour",
  bpm: 88,
  stepsPerBeat: 3,
  loop: true,
  parts: [
    {
      instrument: "flute",
      gain: 0.45,
      pan: 0.2,
      notes: [
        "E5:3 C#5:2 D5:1", "F#5:3 E5:2 D5:1", "C#5:2 E5:1 A5:3", "G#5:3 E5:3",
        "E5:3 C#5:2 D5:1", "F#5:2 A5:1 F#5:2 D5:1", "E5:2 D5:1 B4:2 G#4:1", "A4:6",
        "C#5:3 F#5:3", "F#5:2 E5:1 D5:2 A4:1", "C#5:2 D5:1 E5:3", "B4:3 G#4:3",
        "A5:3 F#5:2 C#5:1", "D5:3 F#5:2 A5:1", "G#5:2 B5:1 G#5:2 E5:1", "A5:6",
      ].join(" "),
    },
    { instrument: "guitar", gain: 0.4, pan: -0.25, notes: arpeggiate(LUZZU_CHORDS, 3, [0, 1, 2, 3, 2, 1], 6) },
    { instrument: "marimba", gain: 0.16, pan: 0.35, notes: arpeggiate(LUZZU_CHORDS, 4, [-1, -1, -1, 2, -1, 1], 6) },
    { instrument: "pad", gain: 0.12, notes: sustain(LUZZU_CHORDS, 3, 6) },
    { instrument: "bass", gain: 0.42, notes: bassLine(LUZZU_CHORDS, 2, [[0, 0, 3], [3, 1, 3]], 6) },
  ],
  drums: [
    { voice: "dum", pattern: "x.....", gain: 0.3 },
    { voice: "shaker", pattern: "x.xx.x", gain: 0.08 },
    { voice: "tambourine", pattern: "...x..", gain: 0.12 },
  ],
};

// ─── Gym stages: "Bastions" ─────────────────────────────────────────────────────────────────
// D minor, a slow march for Mdina's walls and the forts of the Grand Harbour.

const BASTION_CHORDS = ["Dm", "Bb", "C", "Dm", "Dm", "Gm", "A", "A", "Bb", "F", "C", "Dm", "Gm", "Dm", "A", "Dm"];

const bastions: Track = {
  id: "bastions",
  bpm: 96,
  stepsPerBeat: 2,
  loop: true,
  parts: [
    {
      instrument: "brass",
      gain: 0.3,
      notes: [
        "D5:3 D5:1 F5:2 A5:2", "Bb5:3 A5:1 G5:2 F5:2", "E5:2 G5:2 C6:2 Bb5:2", "A5:6 r:2",
        "D5:3 E5:1 F5:2 D5:2", "G5:3 A5:1 Bb5:2 G5:2", "A5:2 C#6:2 E6:2 C#6:2", "A5:6 r:2",
        "F5:2 Bb5:2 D6:2 Bb5:2", "C6:3 A5:1 F5:4", "G5:2 C6:2 E6:2 C6:2", "D6:6 r:2",
        "Bb5:2 A5:2 G5:2 D5:2", "F5:2 E5:2 D5:2 A5:2", "C#6:2 A5:2 E5:2 G5:2", "F5:2 E5:2 D5:4",
      ].join(" "),
    },
    { instrument: "zaqq", gain: 0.12, notes: repeat("D3+A3:16", 8) },
    { instrument: "pad", gain: 0.16, notes: sustain(BASTION_CHORDS, 3, 8) },
    { instrument: "guitar", gain: 0.26, pan: -0.3, notes: arpeggiate(BASTION_CHORDS, 3, [0, -1, 2, -1, 1, -1, 2, -1], 8) },
    { instrument: "bass", gain: 0.45, notes: bassLine(BASTION_CHORDS, 2, [[0, 0, 3], [3, 0, 1], [4, 1, 4]], 8) },
  ],
  drums: [
    { voice: "snare", pattern: "x..xx.x.", gain: 0.16 },
    { voice: "dum", pattern: "x...x...", gain: 0.34 },
    { voice: "crash", pattern: "x" + ".".repeat(63), gain: 0.08 },
  ],
};

// ─── Wild battle: "Clash in the Garigue" ────────────────────────────────────────────────────
// E Phrygian dominant, fast — the Levant and North Africa both an evening's sail away.

const CLASH_CHORDS = ["E", "F", "E", "Dm", "E", "F", "Dm", "E", "Am", "E", "Am", "E", "Dm", "E", "F", "E"];

const battleWild: Track = {
  id: "battleWild",
  bpm: 148,
  stepsPerBeat: 2,
  loop: true,
  parts: [
    {
      instrument: "lead",
      gain: 0.3,
      pan: 0.1,
      notes: [
        "E5:2 F5:1 G#5:1 A5:2 G#5:2", "F5:2 E5:1 F5:1 A5:2 C6:2", "B5:3 A5:1 G#5:2 F5:2", "E5:4 D5:2 F5:2",
        "E5:2 F5:1 G#5:1 B5:2 A5:2", "C6:2 B5:1 A5:1 G#5:2 A5:2", "D5:2 F5:2 A5:2 G#5:2", "B5:4 G#5:2 E5:2",
        "A5:2 C6:2 B5:1 A5:1 G#5:2", "B5:4 E5:4", "A5:1 B5:1 C6:2 D6:2 C6:2", "B5:6 r:2",
        "D6:2 C6:2 A5:2 F5:2", "G#5:2 B5:2 E6:4", "F5:2 A5:2 C6:2 A5:2", "G#5:2 F5:2 E5:4",
      ].join(" "),
    },
    { instrument: "guitar", gain: 0.3, pan: -0.3, notes: arpeggiate(CLASH_CHORDS, 4, [0, 1, 2, 1, 0, 1, 2, 1], 8) },
    { instrument: "bass", gain: 0.55, notes: bassLine(CLASH_CHORDS, 2, [[0, 0, 1], [1, 0, 1], [2, 2, 1], [3, 0, 1], [4, 0, 1], [5, 1, 1], [6, 2, 1], [7, 1, 1]], 8) },
    { instrument: "pad", gain: 0.1, notes: sustain(CLASH_CHORDS, 3, 8) },
  ],
  drums: [
    { voice: "kick", pattern: "x..xx...", gain: 0.5 },
    { voice: "snare", pattern: "..x...x.", gain: 0.3 },
    { voice: "hat", pattern: "xxxxxxxx", gain: 0.08 },
    { voice: "tambourine", pattern: ".x.x.x.x", gain: 0.1 },
  ],
};

// ─── Trainer battle: "The Challenge" ────────────────────────────────────────────────────────
// A harmonic minor with the żaqq droning underneath — someone has come out to test you.

const CHALLENGE_CHORDS = ["Am", "Dm", "E", "Am", "F", "Dm", "E", "E", "Am", "Dm", "E", "Am", "F", "Dm", "E", "Am"];
const CHALLENGE_MELODY = [
  "A4:2 C5:2 E5:2 A5:2", "F5:3 E5:1 D5:2 F5:2", "G#5:2 E5:2 B4:2 G#4:2", "A4:4 E5:4",
  "F5:2 A5:2 G#5:2 F5:2", "E5:2 D5:2 C5:2 D5:2", "B4:2 C5:1 D5:1 E5:2 G#5:2", "B5:6 r:2",
  "C6:2 B5:1 A5:1 E5:2 A5:2", "D6:3 C6:1 A5:2 F5:2", "E5:2 G#5:2 B5:2 D6:2", "C6:4 A5:4",
  "A5:2 C6:2 F6:2 C6:2", "D6:2 A5:2 F5:2 D5:2", "E5:2 F5:2 G#5:2 B5:2", "A5:6 r:2",
].join(" ");

const battleTrainer: Track = {
  id: "battleTrainer",
  bpm: 156,
  stepsPerBeat: 2,
  loop: true,
  parts: [
    { instrument: "lead", gain: 0.28, pan: 0.15, notes: CHALLENGE_MELODY },
    { instrument: "zaqq", gain: 0.1, pan: -0.1, notes: repeat("A2+E3:16", 8) },
    { instrument: "guitar", gain: 0.28, pan: -0.3, notes: arpeggiate(CHALLENGE_CHORDS, 3, [0, 2, 1, 2, 0, 2, 1, 2], 8) },
    { instrument: "bass", gain: 0.55, notes: bassLine(CHALLENGE_CHORDS, 2, [[0, 0, 2], [2, 0, 1], [3, 2, 1], [4, 0, 2], [6, 1, 2]], 8) },
  ],
  drums: [
    { voice: "kick", pattern: "x...x.x.", gain: 0.5 },
    { voice: "snare", pattern: "..x...x.", gain: 0.32 },
    { voice: "dum", pattern: "x..x..x.", gain: 0.22 },
    { voice: "tek", pattern: ".x..x..x", gain: 0.14 },
    { voice: "hat", pattern: "xxxxxxxx", gain: 0.07 },
  ],
};

// ─── Gym leader: the same challenge, pushed harder — brass doubling, faster, a crash on each phrase.

const battleGym: Track = {
  ...battleTrainer,
  id: "battleGym",
  bpm: 168,
  parts: [
    ...battleTrainer.parts,
    { instrument: "brass", gain: 0.18, pan: -0.15, notes: CHALLENGE_MELODY },
  ],
  drums: [
    ...(battleTrainer.drums ?? []),
    { voice: "crash", pattern: "x" + ".".repeat(31), gain: 0.12 },
    { voice: "tambourine", pattern: "x.x.x.x.", gain: 0.1 },
  ],
};

// ─── Evolution: rising, glittering, a little uncanny ─────────────────────────────────────────

const evolution: Track = {
  id: "evolution",
  bpm: 100,
  stepsPerBeat: 4,
  loop: true,
  parts: [
    { instrument: "bell", gain: 0.2, notes: arpeggiate(["Cmaj7", "Ebmaj7", "Abmaj7", "G7"], 5, [0, 1, 2, 3, 4, 3, 2, 1], 16) },
    { instrument: "pad", gain: 0.2, notes: sustain(["Cmaj7", "Ebmaj7", "Abmaj7", "G7"], 3, 16) },
    { instrument: "bass", gain: 0.3, notes: bassLine(["C", "Eb", "Ab", "G"], 2, [[0, 0, 16]], 16) },
  ],
  drums: [{ voice: "shaker", pattern: "x.x.x.x.x.x.x.x.", gain: 0.05 }],
};

// ─── Finale: every trainer beaten — the title tune, in full, with the whole band ─────────────

const finale: Track = {
  ...title,
  id: "finale",
  bpm: 92,
  parts: [
    ...title.parts,
    { instrument: "brass", gain: 0.16, notes: title.parts[0].notes },
    { instrument: "bell", gain: 0.1, notes: arpeggiate(TITLE_CHORDS, 5, [0, -1, 1, -1, 2, -1, 1, -1], 8) },
  ],
  drums: [
    { voice: "dum", pattern: "x...x...", gain: 0.36 },
    { voice: "tambourine", pattern: "..x...x.", gain: 0.16 },
    { voice: "crash", pattern: "x" + ".".repeat(63), gain: 0.1 },
  ],
};

// ─── Jingles ────────────────────────────────────────────────────────────────────────────────

const victory: Track = {
  id: "victory",
  bpm: 132,
  stepsPerBeat: 2,
  loop: false,
  parts: [
    { instrument: "brass", gain: 0.34, notes: "G4:1 C5:1 E5:1 G5:2 E5:1 G5:1 A5:1 G5:4 C6:6 r:2" },
    { instrument: "bell", gain: 0.18, notes: "r:8 C6+E6+G6:8" },
    { instrument: "pad", gain: 0.18, notes: "C4+E4+G4:4 F4+A4+C5:4 C4+E4+G4:8" },
    { instrument: "bass", gain: 0.45, notes: "C3:4 F2:4 C3:6 r:2" },
  ],
  drums: [
    { voice: "snare", pattern: "xxx.x.x.X.......", gain: 0.2 },
    { voice: "crash", pattern: "........x.......", gain: 0.14 },
  ],
};

const caught: Track = {
  id: "caught",
  bpm: 140,
  stepsPerBeat: 2,
  loop: false,
  parts: [
    { instrument: "bell", gain: 0.3, notes: "D5:1 F#5:1 A5:1 D6:1 r:1 A5:1 D6:6" },
    { instrument: "guitar", gain: 0.3, notes: "D4+F#4+A4:4 G4+B4+D5:2 D4+F#4+A4:6" },
    { instrument: "bass", gain: 0.4, notes: "D3:4 G2:2 D3:6" },
  ],
  drums: [{ voice: "tambourine", pattern: "x.x.x.x.x...", gain: 0.16 }],
};

const levelUp: Track = {
  id: "levelUp",
  bpm: 160,
  stepsPerBeat: 2,
  loop: false,
  parts: [
    { instrument: "bell", gain: 0.3, notes: "C5:1 E5:1 G5:1 C6:1 E6:1 G6:3" },
    { instrument: "brass", gain: 0.2, notes: "r:5 C5+E5+G5:3" },
  ],
};

const medal: Track = {
  id: "medal",
  bpm: 108,
  stepsPerBeat: 2,
  loop: false,
  parts: [
    { instrument: "brass", gain: 0.34, notes: "D5:1 D5:1 D5:1 A5:3 G5:1 F#5:1 G5:2 A5:2 B5:2 A5:4 D6:8" },
    { instrument: "pad", gain: 0.2, notes: "D4+F#4+A4:6 G4+B4+D5:4 A4+C#5+E5:6 D4+F#4+A4+D5:8" },
    { instrument: "bell", gain: 0.16, notes: "r:16 D6+F#6+A6:8" },
    { instrument: "bass", gain: 0.45, notes: "D3:6 G2:4 A2:6 D2:8" },
  ],
  drums: [
    { voice: "snare", pattern: "xxx.....x.x.x.x.X.......", gain: 0.2 },
    { voice: "crash", pattern: "................x.......", gain: 0.16 },
  ],
};

const blackout: Track = {
  id: "blackout",
  bpm: 60,
  stepsPerBeat: 2,
  loop: false,
  parts: [
    { instrument: "flute", gain: 0.4, notes: "A4:2 G4:2 F4:2 E4:4 D4:6" },
    { instrument: "pad", gain: 0.22, notes: "D3+F3+A3:4 Bb2+D3+F3:2 A2+C#3+E3:4 D3+F3+A3:6" },
  ],
};

const heal: Track = {
  id: "heal",
  bpm: 150,
  stepsPerBeat: 2,
  loop: false,
  parts: [
    { instrument: "bell", gain: 0.3, notes: "C6:1 E6:1 G6:1 E6:1 C7:4" },
    { instrument: "marimba", gain: 0.25, notes: "C5+E5+G5:8" },
  ],
};

export const TRACKS: Record<TrackId, Track> = {
  title,
  overworld,
  harbour,
  bastions,
  battleWild,
  battleTrainer,
  battleGym,
  evolution,
  finale,
  victory,
  caught,
  levelUp,
  medal,
  blackout,
  heal,
};

/** How many steps a track runs for: its longest part (jingles let parts end at different times). */
export function trackLength(track: Track): number {
  return Math.max(...track.parts.map((part) => parsePart(part.notes).length));
}
