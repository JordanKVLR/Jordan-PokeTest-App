import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DEFAULT_SETTINGS, detectLanguage, withDefaults, type ControlMode, type Settings } from "../game/settings";

/**
 * Device-wide preferences. Stored under their own key rather than inside the save, so a New
 * Game — which wipes the save — leaves language, controls and pacing exactly as they were.
 */

const SETTINGS_KEY = "melita-settings";
const SETTINGS_VERSION = 1;

interface SettingsState extends Settings {
  set: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  resetSettings: () => void;
}

/**
 * Before Settings existed, the joystick/D-pad choice lived inside the save file. On the first
 * launch with a settings store, read it from there once so a returning player's controls do
 * not quietly switch back to the default. Any stored settings blob overrides this.
 */
function legacyControlMode(): ControlMode | undefined {
  try {
    const raw = globalThis.localStorage?.getItem("melita-save");
    const mode = raw ? JSON.parse(raw)?.state?.controlMode : undefined;
    return mode === "joystick" || mode === "dpad" ? mode : undefined;
  } catch {
    return undefined;
  }
}

function deviceLocale(): string | undefined {
  return typeof navigator !== "undefined" ? navigator.language : undefined;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      language: detectLanguage(deviceLocale()),
      controlMode: legacyControlMode() ?? DEFAULT_SETTINGS.controlMode,
      set: (key, value) => set({ [key]: value } as Partial<SettingsState>),
      resetSettings: () => set({ ...DEFAULT_SETTINGS, language: detectLanguage(deviceLocale()) }),
    }),
    {
      name: SETTINGS_KEY,
      version: SETTINGS_VERSION,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => {
        const { set: _set, resetSettings: _reset, ...settings } = state;
        return settings;
      },
      // Nothing stored yet (first launch): keep the initial state, which already carries the
      // detected language and any controls inherited from the old save. Otherwise an option
      // added after the player last saved simply takes its default.
      merge: (persisted, current) =>
        persisted ? { ...current, ...withDefaults(persisted as Partial<Settings>) } : current,
    }
  )
);

/** Snapshot of the current settings outside React — for callbacks that fire later. */
export function currentSettings(): Settings {
  const { set: _set, resetSettings: _reset, ...settings } = useSettings.getState();
  return settings;
}
