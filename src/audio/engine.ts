import { midiToFrequency, parsePart, type NoteEvent } from "./notes";
import { TRACKS, trackLength, type DrumVoice, type InstrumentId, type Track, type TrackId } from "./tracks";

/**
 * The sound of the game, made on the spot with the Web Audio API. There are no audio files:
 * every instrument is a small synthesiser, every piece of music a score (tracks.ts) played by a
 * look-ahead sequencer, and every sound effect a recipe (sfx.ts) built from the same parts.
 *
 * Browsers only allow sound after the player has touched the page, so nothing is created until
 * `unlockAudio` runs from a gesture; until then requests are remembered and played on unlock.
 * Everything is a silent no-op where Web Audio doesn't exist (native builds, tests).
 */

type Ctx = AudioContext;

let warned = false;
/**
 * Sound must never be able to break the game: a browser that dislikes some corner of Web Audio
 * gets silence, not a crashed page. Every way into the engine goes through this.
 */
export function quietly<A extends unknown[], R>(fn: (...args: A) => R): (...args: A) => R | undefined {
  return (...args: A) => {
    try {
      return fn(...args);
    } catch (error) {
      if (!warned) {
        warned = true;
        console.warn("Audio problem; carrying on without it:", error);
      }
      return undefined;
    }
  };
}

interface Buses {
  master: GainNode;
  music: GainNode;
  sfx: GainNode;
  reverb: ConvolverNode;
  reverbSend: GainNode;
  noise: AudioBuffer;
}

let ctx: Ctx | null = null;
let buses: Buses | null = null;
let musicVolume = 0.65;
let sfxVolume = 0.65;

/** The browser's AudioContext — including the prefixed one older iPhones still ship. */
function contextClass(): typeof AudioContext | undefined {
  if (typeof globalThis === "undefined") return undefined;
  const g = globalThis as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
  return g.AudioContext ?? g.webkitAudioContext;
}

export function audioSupported(): boolean {
  return typeof contextClass() === "function";
}

/** The live context and buses, or null before unlock / where there is no Web Audio. */
export function audio(): { ctx: Ctx; buses: Buses } | null {
  return ctx && buses ? { ctx, buses } : null;
}

function makeNoise(context: Ctx): AudioBuffer {
  const buffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

/** A generated room: two seconds of noise, decaying — a stone chapel more than a concert hall. */
function makeImpulse(context: Ctx, seconds = 1.5): AudioBuffer {
  // Mono and a second and a half: a stereo two-second room cost four times as much to run and
  // was the heaviest single thing in the mix. Under music this soft, nobody hears the difference.
  const length = Math.floor(context.sampleRate * seconds);
  const impulse = context.createBuffer(1, length, context.sampleRate);
  const data = impulse.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 3.2);
  return impulse;
}

/** The mixing desk: music and effects buses into a shared reverb and a safety compressor. */
function buildGraph(context: BaseAudioContext): Buses {
  const master = context.createGain();
  const compressor = context.createDynamicsCompressor();
  // Glue and safety: nothing the game does together — a crit over the gym theme — clips.
  compressor.threshold.value = -12;
  compressor.ratio.value = 4;
  compressor.attack.value = 0.004;
  compressor.release.value = 0.2;
  master.connect(compressor).connect(context.destination);
  const music = context.createGain();
  const sfx = context.createGain();
  const reverb = context.createConvolver();
  reverb.channelCount = 1;
  reverb.channelCountMode = "explicit";
  reverb.buffer = makeImpulse(context as Ctx);
  const reverbSend = context.createGain();
  reverbSend.gain.value = 0.28;
  reverbSend.connect(reverb).connect(master);
  music.connect(master);
  sfx.connect(master);
  return { master, music, sfx, reverb, reverbSend, noise: makeNoise(context as Ctx) };
}

/** Creates the context on the first gesture and plays whatever was asked for before it. */
function unlockAudioUnsafe(): void {
  if (!audioSupported()) return;
  if (!ctx) {
    const Context = contextClass()!;
    // "playback" asks for a roomier audio buffer than "interactive": a few milliseconds more
    // latency on a tap, in exchange for music that doesn't break up when a phone is busy.
    ctx = new Context({ latencyHint: "playback" });
    buses = buildGraph(ctx);
    applyVolumes();
    prepareDrumSamples();
    prewarmPlucks(ctx);
  }
  if (ctx.state === "suspended") void ctx.resume();
  if (wantedTrack && !current) startTrack(wantedTrack);
}

/** Pauses everything while the tab is hidden; picks up where it was on return. */
function setAudioSuspendedUnsafe(suspended: boolean): void {
  if (!ctx) return;
  if (suspended) void ctx.suspend();
  else void ctx.resume();
}

function applyVolumes() {
  if (!ctx || !buses) return;
  // Perceived loudness is roughly logarithmic; squaring makes "low" actually sound low.
  buses.music.gain.setTargetAtTime(musicVolume * musicVolume * 0.8, ctx.currentTime, 0.05);
  buses.sfx.gain.setTargetAtTime(sfxVolume * sfxVolume, ctx.currentTime, 0.05);
}

function setVolumesUnsafe(music: number, sfx: number): void {
  const wasSilent = musicVolume === 0;
  musicVolume = music;
  sfxVolume = sfx;
  applyVolumes();
  // Coming back from "off", start whatever the screen wants; going to "off", stop outright.
  if (wasSilent && music > 0 && wantedTrack && !current) startTrack(wantedTrack);
  if (music === 0 && current) {
    current.stop(0.3);
    current = null;
  }
}

export function sfxEnabled(): boolean {
  return sfxVolume > 0 && !!ctx;
}

// ─── Instruments ─────────────────────────────────────────────────────────────────────────────

/** Karplus–Strong plucked strings, cached per pitch: a burst of noise ringing down a tiny delay. */
/**
 * The string's delay has to be a whole number of samples, and averaging each sample with the
 * next one to be read shortens the loop by half a sample, so an uncorrected high string rings
 * well off pitch — a third of a semitone by A5. The buffer is built at the nearest whole period
 * and `playbackRate` nudges it to true pitch (measured in the browser to within a few cents).
 */
const PLUCK_SECONDS = 1.6;
const pluckCache = new Map<string, { buffer: AudioBuffer; playbackRate: number }>();
function pluckBuffer(context: Ctx, midi: number, decay: number, seconds: number): { buffer: AudioBuffer; playbackRate: number } {
  const key = `${midi}:${decay}`;
  const cached = pluckCache.get(key);
  if (cached) return cached;
  const rate = context.sampleRate;
  const buffer = context.createBuffer(1, Math.floor(rate * seconds), rate);
  const out = buffer.getChannelData(0);
  const target = midiToFrequency(midi);
  const period = Math.max(3, Math.round(rate / target + 0.5));
  const ring = new Float32Array(period);
  // A smoothed burst: less harsh than white noise, closer to a fingertip than a pick. (The
  // smoothing also does the job a per-note tone filter used to, for free.)
  let previous = 0;
  for (let i = 0; i < period; i++) {
    const n = Math.random() * 2 - 1;
    previous = previous * 0.55 + n * 0.45;
    ring[i] = previous;
  }
  let index = 0;
  for (let i = 0; i < out.length; i++) {
    const next = (index + 1) % period;
    const value = ring[index];
    ring[index] = (value + ring[next]) * 0.5 * decay;
    out[i] = value;
    index = next;
  }
  const entry = { buffer, playbackRate: (target * (period - 0.5)) / rate };
  pluckCache.set(key, entry);
  return entry;
}

/** Builds the guitar's strings a few at a time in idle moments, so the first bars never stutter. */
function prewarmPlucks(context: Ctx) {
  let midi = 40;
  const next = () => {
    for (let i = 0; i < 3 && midi <= 84; i++, midi++) pluckBuffer(context, midi, 0.996, PLUCK_SECONDS);
    if (midi <= 84) setTimeout(next, 30);
  };
  setTimeout(next, 30);
}

function panner(context: Ctx, pan: number, destination: AudioNode): AudioNode {
  if (!pan || typeof context.createStereoPanner !== "function") return destination;
  const node = context.createStereoPanner();
  node.pan.value = pan;
  node.connect(destination);
  return node;
}

/** An attack–hold–release envelope on a gain node. */
function envelope(gain: GainNode, time: number, peak: number, attack: number, hold: number, release: number) {
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.linearRampToValueAtTime(peak, time + attack);
  gain.gain.setValueAtTime(peak, time + attack + hold);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + attack + hold + release);
}

function osc(context: Ctx, type: OscillatorType, frequency: number, time: number, stop: number, detune = 0): OscillatorNode {
  const node = context.createOscillator();
  node.type = type;
  node.frequency.value = frequency;
  node.detune.value = detune;
  node.start(time);
  node.stop(stop);
  return node;
}

function vibrato(context: Ctx, target: AudioParam, time: number, stop: number, rate: number, depth: number, delay: number): GainNode {
  const lfo = osc(context, "sine", rate, time, stop);
  const amount = context.createGain();
  amount.gain.setValueAtTime(0, time);
  amount.gain.linearRampToValueAtTime(depth, time + delay + 0.25);
  lfo.connect(amount).connect(target);
  return amount;
}

/**
 * Evens the instruments out: each voice is built differently (a sustained reed is far louder
 * than a decaying pluck at the same setting), so these bring a single held note on each to
 * about the same loudness, measured in the browser. Scores then balance by ear, not by accident.
 */
const INSTRUMENT_TRIM: Record<InstrumentId, number> = {
  guitar: 1.6,
  flute: 0.33,
  reed: 0.5,
  zaqq: 1,
  brass: 0.6,
  bell: 1.1,
  marimba: 1.3,
  pad: 1,
  bass: 0.5,
  lead: 0.55,
};

/**
 * Instruments whose tone filter never moves. On the sequencer's fast path the filter lives once
 * on the part's bus instead of being built for every note.
 */
const PART_FILTER: Partial<Record<InstrumentId, { type: BiquadFilterType; frequency: number; q: number }>> = {
  bass: { type: "lowpass", frequency: 560, q: 0.7 },
  reed: { type: "lowpass", frequency: 2200, q: 1.5 },
  lead: { type: "lowpass", frequency: 2800, q: 0.7 },
  pad: { type: "lowpass", frequency: 1100, q: 0.7 },
  zaqq: { type: "bandpass", frequency: 1000, q: 1.2 },
};

function makeFilter(context: BaseAudioContext, spec: { type: BiquadFilterType; frequency: number; q: number }): BiquadFilterNode {
  const filter = context.createBiquadFilter();
  filter.type = spec.type;
  filter.frequency.value = spec.frequency;
  filter.Q.value = spec.q;
  return filter;
}

/** Plays one note on one instrument. `duration` is the written length in seconds. */
export function playNote(
  instrument: InstrumentId,
  midi: number,
  time: number,
  duration: number,
  level: number,
  pan: number,
  destination: AudioNode,
  wet = 0.3,
  /**
   * The sequencer's fast path: the destination is a part bus that already carries the level,
   * trim, pan and reverb send, so the note connects straight to it. Building those per note was
   * most of what made busy pieces stutter on phones.
   */
  raw = false
): void {
  const live = audio();
  if (!live) return;
  const { ctx: context, buses: b } = live;
  const frequency = midiToFrequency(midi);
  let out: AudioNode = destination;
  if (!raw) {
    const gain = context.createGain();
    gain.gain.value = level * INSTRUMENT_TRIM[instrument];
    gain.connect(panner(context, pan, destination));
    if (wet > 0) {
      const send = context.createGain();
      send.gain.value = wet;
      gain.connect(send).connect(b.reverbSend);
    }
    out = gain;
  }

  if (SAMPLED_INSTRUMENTS[instrument] && !renderingSample) {
    const sample = toneSample(instrument, midi);
    if (sample) {
      playSample(sample, time, 1, out);
      return;
    }
  }

  /** Where a static-filter instrument's oscillators go: its own filter, or straight on if the part has one. */
  const toneInput = (next: AudioNode): AudioNode => {
    const spec = PART_FILTER[instrument];
    if (!spec || raw) return next;
    const filter = makeFilter(context, spec);
    filter.connect(next);
    return filter;
  };

  switch (instrument) {
    case "guitar": {
      const source = context.createBufferSource();
      const string = pluckBuffer(context, midi, 0.996, PLUCK_SECONDS);
      source.buffer = string.buffer;
      source.playbackRate.value = string.playbackRate;
      const g = context.createGain();
      const end = time + Math.max(duration, 0.25) + 0.6;
      g.gain.setValueAtTime(0.9, time);
      g.gain.setValueAtTime(0.9, end - 0.3);
      g.gain.exponentialRampToValueAtTime(0.0001, end);
      source.connect(g).connect(out);
      source.start(time);
      source.stop(end);
      break;
    }
    case "bass": {
      const stop = time + duration + 0.12;
      const g = context.createGain();
      envelope(g, time, 0.9, 0.006, Math.max(0.02, duration - 0.05), 0.1);
      // One triangle through a fixed filter: plenty of weight, and the bass plays on every beat.
      g.connect(out);
      osc(context, "triangle", frequency, time, stop).connect(toneInput(g));
      break;
    }
    case "flute": {
      const stop = time + duration + 0.2;
      const g = context.createGain();
      envelope(g, time, 0.8, 0.06, Math.max(0.02, duration - 0.08), 0.16);
      const body = osc(context, "sine", frequency, time, stop);
      const edge = osc(context, "triangle", frequency, time, stop);
      const edgeLevel = context.createGain();
      edgeLevel.gain.value = 0.25;
      // One vibrato drives both voices.
      const depth = vibrato(context, body.frequency, time, stop, 5.2, frequency * 0.006, 0.15);
      depth.connect(edge.frequency);
      body.connect(g);
      edge.connect(edgeLevel).connect(g);
      g.connect(out);
      break;
    }
    case "reed": {
      const stop = time + duration + 0.1;
      const g = context.createGain();
      envelope(g, time, 0.5, 0.02, Math.max(0.02, duration - 0.04), 0.08);
      g.connect(out);
      const input = toneInput(g);
      // The two detuned voices beat against each other — the accordion's shimmer, for free.
      osc(context, "sawtooth", frequency, time, stop, -7).connect(input);
      osc(context, "square", frequency, time, stop, 7).connect(input);
      break;
    }
    case "zaqq": {
      const stop = time + duration + 0.3;
      const g = context.createGain();
      envelope(g, time, 0.6, 0.25, Math.max(0.02, duration - 0.3), 0.3);
      g.connect(out);
      const nasal = toneInput(g);
      const saw = osc(context, "sawtooth", frequency, time, stop);
      const square = osc(context, "square", frequency * 2, time, stop, 4);
      saw.connect(nasal);
      const squareLevel = context.createGain();
      squareLevel.gain.value = 0.3;
      square.connect(squareLevel).connect(nasal);
      break;
    }
    case "brass": {
      const stop = time + duration + 0.15;
      const g = context.createGain();
      envelope(g, time, 0.55, 0.03, Math.max(0.02, duration - 0.06), 0.12);
      const filter = context.createBiquadFilter();
      filter.type = "lowpass";
      filter.Q.value = 2;
      filter.frequency.setValueAtTime(350, time);
      filter.frequency.exponentialRampToValueAtTime(2600, time + 0.07);
      filter.frequency.exponentialRampToValueAtTime(1500, time + 0.3);
      osc(context, "sawtooth", frequency, time, stop, -5).connect(filter);
      osc(context, "sawtooth", frequency, time, stop, 5).connect(filter);
      filter.connect(g).connect(out);
      break;
    }
    case "lead": {
      const stop = time + duration + 0.1;
      const g = context.createGain();
      envelope(g, time, 0.42, 0.01, Math.max(0.02, duration - 0.03), 0.09);
      g.connect(out);
      const input = toneInput(g);
      osc(context, "square", frequency, time, stop).connect(input);
      osc(context, "sawtooth", frequency, time, stop, 8).connect(input);
      break;
    }
    case "bell": {
      // Glockenspiel partials: bright and inharmonic, dying away at different speeds.
      const partials: [number, number, number][] = [
        [1, 1, 1.4],
        [2.76, 0.4, 0.6],
        [5.4, 0.2, 0.3],
        [8.93, 0.1, 0.15],
      ];
      for (const [ratio, amp, decay] of partials) {
        const g = context.createGain();
        g.gain.setValueAtTime(0.0001, time);
        g.gain.linearRampToValueAtTime(amp * 0.5, time + 0.003);
        g.gain.exponentialRampToValueAtTime(0.0001, time + decay + duration * 0.3);
        osc(context, "sine", frequency * ratio, time, time + decay + duration * 0.3 + 0.05).connect(g).connect(out);
      }
      break;
    }
    case "marimba": {
      const g = context.createGain();
      g.gain.setValueAtTime(0.0001, time);
      g.gain.linearRampToValueAtTime(0.7, time + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, time + 0.6);
      osc(context, "sine", frequency, time, time + 0.65).connect(g);
      const overtone = context.createGain();
      overtone.gain.setValueAtTime(0.25, time);
      overtone.gain.exponentialRampToValueAtTime(0.0001, time + 0.12);
      osc(context, "sine", frequency * 4, time, time + 0.15).connect(overtone).connect(g);
      g.connect(out);
      break;
    }
    case "pad": {
      const stop = time + duration + 0.9;
      const g = context.createGain();
      envelope(g, time, 0.35, 0.45, Math.max(0.02, duration - 0.45), 0.9);
      g.connect(out);
      const input = toneInput(g);
      osc(context, "sawtooth", frequency, time, stop, -9).connect(input);
      osc(context, "sawtooth", frequency, time, stop, 9).connect(input);
      break;
    }
  }
}

// ─── Samples ─────────────────────────────────────────────────────────────────────────────────
//
// Percussive sounds are the same every time, so there is no reason to rebuild each one from
// oscillators and filters on every hit. They are rendered once, offline, into short samples;
// after that a drum hit or a bell note is a single buffer playing. Until a sample is ready the
// live synthesis stands in, so nothing waits.

const drumSamples = new Map<DrumVoice, AudioBuffer>();
const toneSamples = new Map<string, AudioBuffer>();
const pendingSamples = new Set<string>();
/** True while rendering a sample, so the synth doesn't try to use the sample it is making. */
let renderingSample = false;

const DRUM_SECONDS: Record<DrumVoice, number> = {
  kick: 0.45,
  snare: 0.25,
  hat: 0.08,
  tambourine: 0.2,
  dum: 0.45,
  tek: 0.1,
  crash: 1.7,
  shaker: 0.1,
};

/** Renders one sound into a buffer using the same synth code, on a throwaway offline context. */
function renderSample(seconds: number, draw: (destination: AudioNode) => void): Promise<AudioBuffer> | null {
  if (!ctx || typeof OfflineAudioContext === "undefined") return null;
  const offline = new OfflineAudioContext(1, Math.ceil(ctx.sampleRate * seconds), ctx.sampleRate);
  const saved = { ctx, buses };
  try {
    ctx = offline as unknown as Ctx;
    // Only the noise source is needed by the percussive voices.
    buses = { noise: makeNoise(offline as unknown as Ctx) } as Buses;
    renderingSample = true;
    draw(offline.destination);
  } finally {
    renderingSample = false;
    ctx = saved.ctx;
    buses = saved.buses;
  }
  return offline.startRendering();
}

function prepareDrumSamples() {
  for (const voice of Object.keys(DRUM_SECONDS) as DrumVoice[]) {
    renderSample(DRUM_SECONDS[voice], (destination) => playDrum(voice, 0, 1, destination))
      ?.then((buffer) => drumSamples.set(voice, buffer))
      .catch(() => {});
  }
}

const SAMPLED_INSTRUMENTS: Partial<Record<InstrumentId, number>> = { bell: 1.8, marimba: 0.7 };

function toneSample(instrument: InstrumentId, midi: number): AudioBuffer | undefined {
  const key = `${instrument}:${midi}`;
  const ready = toneSamples.get(key);
  if (ready || pendingSamples.has(key)) return ready;
  pendingSamples.add(key);
  renderSample(SAMPLED_INSTRUMENTS[instrument]!, (destination) => playNote(instrument, midi, 0, 0.4, 1, 0, destination, 0, true))
    ?.then((buffer) => toneSamples.set(key, buffer))
    .catch(() => {});
  return undefined;
}

/** Plays a ready-made sample. */
function playSample(buffer: AudioBuffer, time: number, level: number, destination: AudioNode) {
  if (!ctx) return;
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  if (level === 1) {
    source.connect(destination);
  } else {
    const gain = ctx.createGain();
    gain.gain.value = level;
    source.connect(gain).connect(destination);
  }
  source.start(time);
}

/** One drum hit. */
export function playDrum(voice: DrumVoice, time: number, level: number, destination: AudioNode): void {
  const live = audio();
  if (!live) return;
  const sample = renderingSample ? undefined : drumSamples.get(voice);
  if (sample) {
    playSample(sample, time, level, destination);
    return;
  }
  const { ctx: context, buses: b } = live;
  const out = context.createGain();
  out.gain.value = level;
  out.connect(destination);

  const noiseHit = (type: BiquadFilterType, freq: number, q: number, decay: number, peak = 1) => {
    const source = context.createBufferSource();
    source.buffer = b.noise;
    const filter = context.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = freq;
    filter.Q.value = q;
    const g = context.createGain();
    g.gain.setValueAtTime(peak, time);
    g.gain.exponentialRampToValueAtTime(0.0001, time + decay);
    source.connect(filter).connect(g).connect(out);
    source.start(time, Math.random() * 1.5);
    source.stop(time + decay + 0.02);
  };
  const toneHit = (type: OscillatorType, from: number, to: number, drop: number, decay: number, peak = 1) => {
    const node = osc(context, type, from, time, time + decay + 0.02);
    node.frequency.setValueAtTime(from, time);
    node.frequency.exponentialRampToValueAtTime(to, time + drop);
    const g = context.createGain();
    g.gain.setValueAtTime(peak, time);
    g.gain.exponentialRampToValueAtTime(0.0001, time + decay);
    node.connect(g).connect(out);
  };

  switch (voice) {
    case "kick":
      toneHit("sine", 150, 45, 0.12, 0.4);
      break;
    case "snare":
      noiseHit("highpass", 1200, 0.7, 0.16, 0.8);
      toneHit("triangle", 220, 170, 0.05, 0.08, 0.5);
      break;
    case "hat":
      noiseHit("highpass", 7500, 0.8, 0.045, 0.6);
      break;
    case "tambourine":
      noiseHit("bandpass", 8000, 1.2, 0.14, 0.9);
      noiseHit("highpass", 10000, 0.7, 0.05, 0.5);
      break;
    case "dum":
      // The tanbur's open centre stroke.
      toneHit("sine", 120, 68, 0.1, 0.38);
      noiseHit("lowpass", 400, 0.8, 0.08, 0.4);
      break;
    case "tek":
      // A snap at the rim.
      noiseHit("bandpass", 2600, 3, 0.05, 0.9);
      toneHit("sine", 820, 700, 0.03, 0.05, 0.3);
      break;
    case "crash":
      noiseHit("highpass", 4200, 0.6, 1.6, 0.6);
      break;
    case "shaker":
      noiseHit("bandpass", 5200, 1.5, 0.06, 0.7);
      break;
  }
}

// ─── Sequencer ───────────────────────────────────────────────────────────────────────────────

const safeNote = quietly(playNote);
const safeDrum = quietly(playDrum);

// Schedule a quarter of a second ahead, so a busy moment on the page (a screen change, a big
// animation) never leaves the music waiting for its next notes.
const LOOKAHEAD_S = 0.25;
const TICK_MS = 40;

interface ScheduledPart {
  instrument: InstrumentId;
  /** Level, trim, pan and reverb send, built once for the part rather than once per note. */
  bus: AudioNode;
  byStep: Map<number, NoteEvent[]>;
}

class TrackPlayer {
  readonly id: TrackId;
  private readonly track: Track;
  private readonly length: number;
  private readonly stepSeconds: number;
  private readonly parts: ScheduledPart[];
  readonly output: GainNode;
  private step = 0;
  private nextTime: number;
  private timer: ReturnType<typeof setInterval> | null = null;
  private finished = false;

  constructor(
    private readonly context: Ctx,
    id: TrackId,
    destination: AudioNode,
    private readonly onEnd?: () => void,
    /** For offline analysis: leave out the drums, or play only some instruments. */
    private readonly only?: { drums?: boolean; instruments?: InstrumentId[] }
  ) {
    this.id = id;
    this.track = TRACKS[id];
    this.length = trackLength(this.track);
    this.stepSeconds = 60 / this.track.bpm / this.track.stepsPerBeat;
    this.parts = this.track.parts.map((part) => {
      const byStep = new Map<number, NoteEvent[]>();
      for (const event of parsePart(part.notes).events) {
        const list = byStep.get(event.step) ?? [];
        list.push(event);
        byStep.set(event.step, list);
      }
      return { instrument: part.instrument, bus: null as unknown as AudioNode, byStep };
    });
    this.output = context.createGain();
    this.output.connect(destination);
    const reverbSend = audio()?.buses.reverbSend;
    this.track.parts.forEach((part, index) => {
      const bus = context.createGain();
      bus.gain.value = part.gain * INSTRUMENT_TRIM[part.instrument];
      const spec = PART_FILTER[part.instrument];
      const panned = panner(context, part.pan ?? 0, this.output);
      if (spec) bus.connect(makeFilter(context, spec)).connect(panned);
      else bus.connect(panned);
      if (reverbSend) {
        const send = context.createGain();
        send.gain.value = 0.3;
        bus.connect(send).connect(reverbSend);
      }
      this.parts[index].bus = bus;
    });
    this.nextTime = context.currentTime + 0.08;
  }

  start(fadeIn: number) {
    const now = this.context.currentTime;
    this.output.gain.setValueAtTime(fadeIn > 0 ? 0.0001 : 1, now);
    if (fadeIn > 0) this.output.gain.exponentialRampToValueAtTime(1, now + fadeIn);
    this.tick();
    this.timer = setInterval(() => this.tick(), TICK_MS);
  }

  stop(fadeOut: number) {
    const now = this.context.currentTime;
    this.output.gain.cancelScheduledValues(now);
    this.output.gain.setValueAtTime(Math.max(0.0001, this.output.gain.value), now);
    this.output.gain.exponentialRampToValueAtTime(0.0001, now + Math.max(0.02, fadeOut));
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    setTimeout(() => this.output.disconnect(), (fadeOut + 1.5) * 1000);
  }

  /** Lowers the track to `level` (0–1) and back — for a jingle playing over it. */
  duck(level: number, seconds: number) {
    const now = this.context.currentTime;
    this.output.gain.cancelScheduledValues(now);
    this.output.gain.setTargetAtTime(Math.max(0.0001, level), now, seconds / 3);
  }

  /** Schedules everything up to `until` in one go — used to render a piece offline. */
  scheduleUntil(until: number) {
    this.nextTime = 0.05;
    while (this.nextTime < until && !this.finished) this.scheduleNextStep();
  }

  private tick() {
    const horizon = this.context.currentTime + LOOKAHEAD_S;
    // After a long stall (a hidden tab), skip ahead rather than playing a pile-up of notes.
    if (this.nextTime < this.context.currentTime - 0.25) this.nextTime = this.context.currentTime + 0.02;
    while (this.nextTime < horizon && !this.finished) this.scheduleNextStep();
  }

  private scheduleNextStep() {
    {
      if (this.step >= this.length) {
        if (!this.track.loop) {
          this.finished = true;
          if (this.timer) clearInterval(this.timer);
          const tail = Math.max(0, this.nextTime - this.context.currentTime) + 1.2;
          setTimeout(() => this.onEnd?.(), tail * 1000);
          return;
        }
        this.step = 0;
      }
      const swing = this.track.swing && this.step % 2 === 1 ? this.track.swing * this.stepSeconds : 0;
      const time = this.nextTime + swing;
      for (const part of this.parts) {
        if (this.only?.instruments && !this.only.instruments.includes(part.instrument)) continue;
        for (const event of part.byStep.get(this.step) ?? []) {
          for (const midi of event.midi) {
            safeNote(part.instrument, midi, time, event.length * this.stepSeconds, 1, 0, part.bus, 0, true);
          }
        }
      }
      for (const drum of this.only?.drums === false ? [] : this.track.drums ?? []) {
        const hit = drum.pattern[this.step % drum.pattern.length];
        if (hit === "x" || hit === "X") safeDrum(drum.voice, time, drum.gain * (hit === "X" ? 1.4 : 1), this.output);
      }
      this.step += 1;
      this.nextTime += this.stepSeconds;
    }
  }
}

let current: TrackPlayer | null = null;
let wantedTrack: TrackId | null = null;
let jingle: TrackPlayer | null = null;
const jingleQueue: { id: TrackId; options: { then?: "resume" | "stop" } }[] = [];

function startTrack(id: TrackId, fade = 0.8) {
  const live = audio();
  if (!live || musicVolume === 0) return;
  current?.stop(fade);
  current = new TrackPlayer(live.ctx, id, live.buses.music);
  current.start(fade);
}

/**
 * The background music a screen wants. Asking for what is already playing changes nothing, so
 * menus over the map keep the map's tune running; a different piece crossfades in.
 */
function requestMusicUnsafe(id: TrackId | null, fade = 0.8): void {
  if (id === wantedTrack && (current?.id === id || !audio())) return;
  wantedTrack = id;
  if (!audio()) return;
  if (id === null) {
    current?.stop(fade);
    current = null;
    return;
  }
  if (current?.id !== id) startTrack(id, fade);
}

/**
 * A short piece played over the music: the music dips while it plays and comes back after —
 * or, with `then: "stop"`, stays down (the fight is over; the next screen chooses what's next).
 * Jingles never cut each other off: a level-up arriving mid-fanfare waits its turn.
 */
function playJingleUnsafe(id: TrackId, options: { then?: "resume" | "stop" } = {}): void {
  const live = audio();
  if (!live || musicVolume === 0) return;
  if (jingle) {
    jingleQueue.push({ id, options });
    return;
  }
  const backing = current;
  if (options.then === "stop") {
    backing?.stop(0.4);
    if (current === backing) current = null;
    wantedTrack = null;
  } else {
    backing?.duck(0.12, 0.25);
  }
  const player = new TrackPlayer(live.ctx, id, live.buses.music, () => {
    if (jingle !== player) return;
    jingle = null;
    const next = jingleQueue.shift();
    if (next) {
      playJingle(next.id, next.options);
      return;
    }
    // Bring back whatever is playing now — which may be a new screen's music by this point.
    current?.duck(1, 1.2);
  });
  jingle = player;
  player.start(0);
}

/**
 * Renders a piece faster than real time into a buffer, and times it — how much of the audio
 * thread's budget the piece needs. A figure near or over 1 means dropouts on a slow phone.
 */
export async function renderOffline(
  id: TrackId,
  seconds: number,
  only?: { drums?: boolean; instruments?: InstrumentId[]; reverb?: boolean }
): Promise<{ buffer: AudioBuffer; scheduleMs: number; renderMs: number; load: number }> {
  const rate = ctx?.sampleRate ?? 48000;
  const offline = new OfflineAudioContext(2, Math.ceil(rate * seconds), rate);
  const saved = { ctx, buses };
  let scheduleMs = 0;
  try {
    ctx = offline as unknown as Ctx;
    buses = buildGraph(offline);
    buses.music.gain.value = 0.5;
    if (only?.reverb === false) buses.reverbSend.disconnect();
    const player = new TrackPlayer(ctx, id, buses.music, undefined, only);
    const started = performance.now();
    player.scheduleUntil(seconds);
    scheduleMs = performance.now() - started;
  } finally {
    ctx = saved.ctx;
    buses = saved.buses;
  }
  const started = performance.now();
  const buffer = await offline.startRendering();
  const renderMs = performance.now() - started;
  return { buffer, scheduleMs, renderMs, load: renderMs / (seconds * 1000) };
}

/** Just what is playing, for tests of the wiring and for the debug overlay. */
export function nowPlaying(): { music: TrackId | null; wanted: TrackId | null } {
  return { music: current?.id ?? null, wanted: wantedTrack };
}

// A window into the engine for automated checks and for anyone curious in the console:
// `__maltaAudio.nowPlaying()` says what's on; `__maltaAudio.audio()` gives the live graph.
if (typeof globalThis !== "undefined") {
  (globalThis as unknown as { __maltaAudio?: unknown }).__maltaAudio = { nowPlaying, audio, playNote, playDrum, renderOffline };
}

export const unlockAudio = quietly(unlockAudioUnsafe);
export const setAudioSuspended = quietly(setAudioSuspendedUnsafe);
export const setVolumes = quietly(setVolumesUnsafe);
export const requestMusic = quietly(requestMusicUnsafe);
export const playJingle = quietly(playJingleUnsafe);
