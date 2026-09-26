import type { Settings } from "./settings";
import type { StringKey } from "../i18n/core";

/** Settings whose value is one of a fixed set of choices. */
type ChoiceKey = {
  [K in keyof Settings]: Settings[K] extends string ? K : never;
}[keyof Settings];
/** Settings that are simply on or off. */
type ToggleKey = {
  [K in keyof Settings]: Settings[K] extends boolean ? K : never;
}[keyof Settings];

export interface ChoiceRow {
  kind: "choice";
  key: ChoiceKey;
  options: string[];
  /** Show each option's own explanation under the row, for choices that need it. */
  describeOptions?: boolean;
}
export interface ToggleRow {
  kind: "toggle";
  key: ToggleKey;
}
export type Row = ChoiceRow | ToggleRow;

/**
 * Grouped the way a player looks for things — language first, then how you move, then how
 * battles feel, then the world, then comfort. Every label and explanation comes from the
 * string table, so the screen reads in whichever language is set, including the moment the
 * language itself is changed.
 */
export const SETTINGS_SECTIONS: { title: StringKey; rows: Row[] }[] = [
  {
    title: "settings.section.general",
    rows: [{ kind: "choice", key: "language", options: ["en", "mt"] }],
  },
  {
    title: "settings.section.sound",
    rows: [
      { kind: "choice", key: "musicVolume", options: ["off", "low", "medium", "high"] },
      { kind: "choice", key: "sfxVolume", options: ["off", "low", "medium", "high"] },
    ],
  },
  {
    title: "settings.section.controls",
    rows: [
      { kind: "choice", key: "controlMode", options: ["joystick", "dpad"] },
      { kind: "choice", key: "controlSide", options: ["left", "center", "right"] },
    ],
  },
  {
    title: "settings.section.battle",
    rows: [
      { kind: "choice", key: "battlePace", options: ["tap", "standard", "quick", "fastest"], describeOptions: true },
      { kind: "choice", key: "textSpeed", options: ["slow", "normal", "fast"] },
      { kind: "choice", key: "trainerIntros", options: ["full", "brief"] },
    ],
  },
  {
    title: "settings.section.exploring",
    rows: [
      { kind: "choice", key: "encounterRate", options: ["fewer", "normal", "more"] },
      { kind: "toggle", key: "stageBriefings" },
      { kind: "toggle", key: "showFollower" },
    ],
  },
  {
    title: "settings.section.display",
    rows: [
      { kind: "choice", key: "graphics", options: ["3d", "2d"] },
      { kind: "choice", key: "textSize", options: ["normal", "large"] },
      { kind: "toggle", key: "reducedMotion" },
    ],
  },
];

/** Every string key the settings screen will look up, for the completeness test. */
export function settingsStringKeys(): string[] {
  const keys: string[] = [];
  for (const section of SETTINGS_SECTIONS) {
    keys.push(section.title);
    for (const row of section.rows) {
      keys.push(`settings.${row.key}`, `settings.${row.key}.help`);
      if (row.kind === "choice") {
        for (const option of row.options) {
          keys.push(`settings.${row.key}.${option}`);
          if (row.describeOptions) keys.push(`settings.${row.key}.${option}.help`);
        }
      }
    }
  }
  return keys;
}
