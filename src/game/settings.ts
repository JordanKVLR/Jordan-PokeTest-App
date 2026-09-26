/**
 * Player preferences, and the pure rules that turn them into behaviour.
 *
 * Settings belong to the device, not the save file: starting a New Game should not switch the
 * language back to English or the controls back to the joystick. The store that persists them
 * lives in src/state/settingsStore.ts; everything here is plain data and functions, so the
 * rules can be tested without React.
 */

export type Language = "en" | "mt";
export type ControlMode = "joystick" | "dpad";
/** Where the on-screen controls sit over the map — thumb preference. */
export type ControlSide = "left" | "center" | "right";
/**
 * How much the battle waits for the player.
 * - `tap`: every message waits for a tap.
 * - `standard`: a chosen action plays out on its own after a beat; what it did — the damage,
 *   the effects — waits for a tap so there is time to read it.
 * - `quick`: nothing waits for a tap, but each message is still shown for a moment.
 * - `fastest`: no popups at all. The turn plays straight into the battle log on the timings the
 *   game used before battle messages became popups — one attacker every 550ms.
 */
export type BattlePace = "tap" | "standard" | "quick" | "fastest";
export type TextSpeed = "slow" | "normal" | "fast";
/** Full: the elemental wipe and the trainer's line. Brief: straight into the fight. */
export type TrainerIntros = "full" | "brief";
export type EncounterRate = "fewer" | "normal" | "more";
export type TextSize = "normal" | "large";
export type Volume = "off" | "low" | "medium" | "high";

export interface Settings {
  language: Language;
  controlMode: ControlMode;
  controlSide: ControlSide;
  battlePace: BattlePace;
  textSpeed: TextSpeed;
  trainerIntros: TrainerIntros;
  encounterRate: EncounterRate;
  stageBriefings: boolean;
  showFollower: boolean;
  reducedMotion: boolean;
  textSize: TextSize;
  musicVolume: Volume;
  sfxVolume: Volume;
}

export const DEFAULT_SETTINGS: Settings = {
  language: "en",
  controlMode: "joystick",
  controlSide: "center",
  battlePace: "standard",
  textSpeed: "normal",
  trainerIntros: "full",
  encounterRate: "normal",
  stageBriefings: true,
  showFollower: true,
  reducedMotion: false,
  textSize: "normal",
  musicVolume: "medium",
  sfxVolume: "medium",
};

const VOLUME_LEVEL: Record<Volume, number> = { off: 0, low: 0.4, medium: 0.7, high: 1 };

/** A volume setting as a 0–1 level for the audio engine. */
export function volumeLevel(volume: Volume): number {
  return VOLUME_LEVEL[volume] ?? VOLUME_LEVEL.medium;
}

/**
 * What a battle message is, which decides whether it can move on by itself.
 * - `action`: who is doing what ("Calfleaf used Vine Lash.") — the thing that was chosen.
 * - `result`: what it did — damage, effectiveness, stat changes, a faint.
 * - `info`: scene-setting — a creature appears, a trainer sends out their next one.
 * - `key`: something the player has earned or lost — a medal, a catch, the end of the run.
 */
export type MessageKind = "action" | "result" | "info" | "key";

const SPEED_FACTOR: Record<TextSpeed, number> = { slow: 1.6, normal: 1, fast: 0.6 };

/** Base hold times in ms at normal speed, per pace. null = wait for a tap. */
const HOLD: Record<BattlePace, Record<MessageKind, number | null>> = {
  tap: { action: null, result: null, info: null, key: null },
  standard: { action: 1000, result: null, info: 1400, key: null },
  quick: { action: 800, result: 1500, info: 1100, key: 2200 },
  // Never shown as popups (see showsPopups); kept so the table covers every pace.
  fastest: { action: 0, result: 0, info: 0, key: 0 },
};

/** Whether battle messages appear as popups at all. On Fastest they only go into the log. */
export function showsPopups(pace: BattlePace): boolean {
  return pace !== "fastest";
}

/** Time between one attacker's beat and the next on Fastest: the pre-popup turn rhythm. */
export const FASTEST_BEAT_MS = 550;

/** Extra time per additional line, so a three-line result is not gone before it is read. */
const PER_EXTRA_LINE_MS = 550;

/**
 * How long a battle message stays up before moving on by itself, or null if it waits for a tap.
 * A tap always skips ahead early whichever way this comes out.
 */
export function autoAdvanceMs(
  kind: MessageKind,
  settings: Pick<Settings, "battlePace" | "textSpeed">,
  lineCount = 1
): number | null {
  const base = HOLD[settings.battlePace][kind];
  if (base === null) return null;
  const withLines = base + PER_EXTRA_LINE_MS * Math.max(0, lineCount - 1);
  return Math.round(withLines * SPEED_FACTOR[settings.textSpeed]);
}

/**
 * How long the trainer's opening line holds before the fight starts, or null to wait for a tap.
 * Only Quick and Fastest let it go by itself — the line is the trainer's one moment.
 */
export function trainerIntroHoldMs(settings: Pick<Settings, "battlePace" | "textSpeed">): number | null {
  if (settings.battlePace === "fastest") return Math.round(1200 * SPEED_FACTOR[settings.textSpeed]);
  if (settings.battlePace !== "quick") return null;
  return Math.round(2400 * SPEED_FACTOR[settings.textSpeed]);
}

const ENCOUNTER_FACTOR: Record<EncounterRate, number> = { fewer: 0.5, normal: 1, more: 1.5 };

/** The chance of a wild encounter per step on a biome tile, scaled by preference. */
export function encounterChance(base: number, rate: EncounterRate): number {
  return Math.min(1, base * ENCOUNTER_FACTOR[rate]);
}

/** Fills any setting a stored blob is missing — an older build, or a new option added since. */
export function withDefaults(stored: Partial<Settings> | null | undefined): Settings {
  return { ...DEFAULT_SETTINGS, ...(stored ?? {}) };
}

/** The language a first-time player gets: Maltese if their device says so, English otherwise. */
export function detectLanguage(deviceLocale: string | undefined | null): Language {
  return deviceLocale?.toLowerCase().startsWith("mt") ? "mt" : "en";
}
