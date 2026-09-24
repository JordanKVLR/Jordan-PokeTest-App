import type { Language } from "../game/settings";
import { en, type StringKey } from "./en";
import { mt } from "./mt";
import { contentFor, type Content } from "./content";

/**
 * The game's two languages — the pure half, safe to import from game logic and tests.
 *
 * UI text lives in en.ts / mt.ts under the same keys; mt.ts is typed against en.ts, so a key
 * added in English without its Maltese fails the type check rather than quietly showing
 * English to a Maltese player. Game content — move names, creature lore, stage names — is
 * looked up by id through content.ts, with the English data files as the source of truth.
 */

export type { StringKey } from "./en";
export type { Language } from "../game/settings";
export type Params = Record<string, string | number>;

const DICTIONARIES: Record<Language, Record<StringKey, string>> = { en, mt };

/** Replaces {name} placeholders. A missing param is left visible rather than silently blank. */
function fill(template: string, params?: Params): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    params[name] !== undefined ? String(params[name]) : match
  );
}

export function translate(lang: Language, key: StringKey, params?: Params): string {
  return fill(DICTIONARIES[lang][key] ?? en[key], params);
}

/** A plural-aware pick: `one` when count is 1, `many` otherwise. Both get {count}. */
export function plural(lang: Language, count: number, one: StringKey, many: StringKey, params?: Params): string {
  return translate(lang, count === 1 ? one : many, { count, ...params });
}

export interface I18n {
  lang: Language;
  t: (key: StringKey, params?: Params) => string;
  plural: (count: number, one: StringKey, many: StringKey, params?: Params) => string;
  /** Game content in the current language: moves, items, types, stages, lore. */
  c: Content;
}

export function i18nFor(lang: Language): I18n {
  return {
    lang,
    t: (key, params) => translate(lang, key, params),
    plural: (count, one, many, params) => plural(lang, count, one, many, params),
    c: contentFor(lang),
  };
}
