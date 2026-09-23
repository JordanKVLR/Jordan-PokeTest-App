import startersData from "../data/starters.json";
import movesData from "../data/moves.json";
import itemsData from "../data/items.json";
import wildCreaturesData from "../data/wildCreatures.json";
import regionalVariantsData from "../data/regionalVariants.json";
import legendariesData from "../data/legendaries.json";
import type { Language } from "../game/settings";
import { STAGES, ALL_MEDALS } from "../game/zoneProgression";
import { STARTER_QUIZ_QUESTIONS } from "../game/starterQuiz";
import { boastText, type BoastRef } from "./boasts";
import {
  MT_ERAS,
  MT_FLAVOR,
  MT_GYMS,
  MT_ITEMS,
  MT_MOVES,
  MT_QUIZ,
  MT_SIGNATURES,
  MT_STAGES,
  MT_STATS,
  MT_TRAINER_TITLES,
  MT_TYPES,
} from "./content.mt";

/**
 * Game content in a chosen language, looked up by id.
 *
 * English comes straight from the data files, which remain the one place new content is
 * written. Maltese comes from content.mt.ts. Anything missing in Maltese falls back to the
 * English rather than showing a raw id — and the i18n test fails the build if anything is.
 */

export interface Content {
  type: (type: string) => string;
  move: (moveId: string) => string;
  item: (itemId: string) => string;
  itemDescription: (itemId: string) => string;
  stage: (zoneId: string) => string;
  medal: (medalId: string) => string;
  gymTitle: (medalId: string) => string;
  trainerTitle: (title: string) => string;
  flavor: (speciesId: string) => string | undefined;
  signature: (name: string) => string;
  era: (era: string) => string;
  stat: (stat: string) => string;
  quizPrompt: (questionId: string) => string;
  quizOption: (questionId: string, index: number) => string;
  boast: (ref: BoastRef) => string;
}

const EN_MOVES = new Map(movesData.moves.map((m) => [m.id, m.name]));
const EN_ITEMS = new Map(itemsData.items.map((i) => [i.id, i]));
const EN_STAGES = new Map(STAGES.map((s) => [s.id, s.name]));
const EN_GYMS = new Map(ALL_MEDALS.map((g) => [g.medalId, g]));
const EN_FLAVOR = new Map<string, string>([
  ...startersData.starters.flatMap((line) =>
    line.stages.filter((stage) => stage.flavor).map((stage) => [stage.id, stage.flavor!] as [string, string])
  ),
  ...wildCreaturesData.wildCreatures.map((c) => [c.id, c.flavor] as [string, string]),
  ...regionalVariantsData.regionalVariants.map((c) => [c.id, c.flavor] as [string, string]),
  ...legendariesData.legendaries.map((c) => [c.id, c.aesthetic] as [string, string]),
]);
const EN_QUIZ = new Map(STARTER_QUIZ_QUESTIONS.map((q) => [q.id, q]));

const EN_ERAS: Record<string, string> = {
  wild: "Native fauna",
  neolithic: "Temple Builders · 3600–2500 BC",
  bronze: "Bronze Age · 2500–700 BC",
  phoenician: "Phoenician & Punic · 800–218 BC",
  roman: "Roman & Byzantine · 218 BC–870 AD",
  arab: "Arab Period · 870–1091",
  knights: "Order of St John · 1530–1798",
  ottoman: "Great Siege · 1565",
  british: "British Period · 1800–1964",
};

const EN_STATS: Record<string, string> = {
  hp: "HP",
  atk: "Attack",
  def: "Defense",
  spatk: "Sp. Attack",
  spdef: "Sp. Defense",
  speed: "Speed",
  accuracy: "Accuracy",
  evasion: "Evasion",
};

const english: Content = {
  type: (t) => t,
  move: (id) => EN_MOVES.get(id) ?? id,
  item: (id) => EN_ITEMS.get(id)?.name ?? id,
  itemDescription: (id) => EN_ITEMS.get(id)?.description ?? "",
  stage: (id) => EN_STAGES.get(id) ?? id,
  medal: (id) => EN_GYMS.get(id)?.medalName ?? id,
  gymTitle: (id) => EN_GYMS.get(id)?.leaderTitle ?? "",
  trainerTitle: (title) => title,
  flavor: (id) => EN_FLAVOR.get(id),
  signature: (name) => name,
  era: (era) => EN_ERAS[era] ?? era,
  stat: (stat) => EN_STATS[stat] ?? stat,
  quizPrompt: (id) => EN_QUIZ.get(id)?.prompt ?? "",
  quizOption: (id, index) => EN_QUIZ.get(id)?.options[index]?.label ?? "",
  boast: (ref) => boastText(ref, "en", ref.kind === "gym" ? english.medal(ref.medalId) : undefined),
};

const maltese: Content = {
  type: (t) => MT_TYPES[t] ?? english.type(t),
  move: (id) => MT_MOVES[id] ?? english.move(id),
  item: (id) => MT_ITEMS[id]?.name ?? english.item(id),
  itemDescription: (id) => MT_ITEMS[id]?.description ?? english.itemDescription(id),
  stage: (id) => MT_STAGES[id] ?? english.stage(id),
  medal: (id) => MT_GYMS[id]?.medalName ?? english.medal(id),
  gymTitle: (id) => MT_GYMS[id]?.leaderTitle ?? english.gymTitle(id),
  trainerTitle: (title) => MT_TRAINER_TITLES[title] ?? title,
  flavor: (id) => MT_FLAVOR[id] ?? english.flavor(id),
  signature: (name) => MT_SIGNATURES[name] ?? name,
  era: (era) => MT_ERAS[era] ?? english.era(era),
  stat: (stat) => MT_STATS[stat] ?? english.stat(stat),
  quizPrompt: (id) => MT_QUIZ[id]?.prompt ?? english.quizPrompt(id),
  quizOption: (id, index) => MT_QUIZ[id]?.options[index] ?? english.quizOption(id, index),
  boast: (ref) => boastText(ref, "mt", ref.kind === "gym" ? maltese.medal(ref.medalId) : undefined),
};

export function contentFor(lang: Language): Content {
  return lang === "mt" ? maltese : english;
}

/** Exposed for the completeness test: every id the data defines, per kind. */
export const CONTENT_IDS = {
  moves: [...EN_MOVES.keys()],
  items: [...EN_ITEMS.keys()],
  stages: [...EN_STAGES.keys()],
  medals: [...EN_GYMS.keys()],
  creatures: [...EN_FLAVOR.keys()],
  quiz: [...EN_QUIZ.keys()],
  eras: Object.keys(EN_ERAS),
  stats: Object.keys(EN_STATS),
};
