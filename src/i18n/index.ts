import { useSettings } from "../state/settingsStore";
import { i18nFor, type I18n } from "./core";

export * from "./core";

/** The current language's helpers; re-renders the component when the language changes. */
export function useI18n(): I18n {
  const lang = useSettings((s) => s.language);
  return i18nFor(lang);
}

/** For callbacks that run outside render (timers, animation completions). */
export function currentI18n(): I18n {
  return i18nFor(useSettings.getState().language);
}
