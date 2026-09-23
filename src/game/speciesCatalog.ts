import startersData from "../data/starters.json";
import legendariesData from "../data/legendaries.json";
import regionalVariantsData from "../data/regionalVariants.json";
import wildCreaturesData from "../data/wildCreatures.json";
import {
  StartersFileSchema,
  LegendariesFileSchema,
  RegionalVariantsFileSchema,
  WildCreaturesFileSchema,
  type StatBlock,
  type TypeName,
  type Era,
} from "../data/schemas";

export type DexCategory = "starter" | "legendary" | "regional" | "wild";

export interface DexEntry {
  speciesId: string;
  name: string;
  types: TypeName[];
  category: DexCategory;
  /** Undefined where the source data doesn't define stats yet (see GAME_SPEC.md gaps). */
  stats?: StatBlock;
  flavor?: string;
  signatureMove?: string;
  storyFlagRequired?: string;
  /** Starter stages only: the level this stage evolves at, or null for a final stage. */
  evolvesAtLevel?: number | null;
  /** Which layer of Maltese history this creature belongs to (wild creatures only). */
  era?: Era;
}

/** Display names for the eras, with the dates that make the timeline legible in the Codex. */
export const ERA_LABELS: Record<Era, string> = {
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

/** Chronological order, for grouping the Codex as a timeline rather than a flat list. */
export const ERA_ORDER: Era[] = [
  "neolithic",
  "bronze",
  "phoenician",
  "roman",
  "arab",
  "knights",
  "ottoman",
  "british",
  "wild",
];

const starters = StartersFileSchema.parse(startersData).starters;
const legendaries = LegendariesFileSchema.parse(legendariesData).legendaries;
const regionalVariants = RegionalVariantsFileSchema.parse(regionalVariantsData).regionalVariants;
const wildCreatures = WildCreaturesFileSchema.parse(wildCreaturesData).wildCreatures;

const starterEntries: DexEntry[] = starters.flatMap((line) =>
  line.stages.map((stage) => ({
    speciesId: stage.id,
    name: stage.name,
    types: stage.types,
    category: "starter" as const,
    stats: stage.baseStats,
    flavor: stage.flavor,
    era: stage.era,
    // The signature move is the line's, and the Codex says so from the first stage on.
    signatureMove: line.signatureMove,
    evolvesAtLevel: stage.evolvesAtLevel,
  }))
);

const legendaryEntries: DexEntry[] = legendaries.map((l) => ({
  speciesId: l.id,
  name: l.name,
  types: l.types,
  category: "legendary" as const,
  stats: l.baseStats,
  flavor: l.aesthetic,
  signatureMove: l.signatureMove,
  storyFlagRequired: l.storyFlagRequired,
}));

const regionalEntries: DexEntry[] = regionalVariants.map((v) => ({
  speciesId: v.id,
  name: v.name,
  types: v.types,
  category: "regional" as const,
  flavor: v.flavor,
  stats: v.baseStats,
}));

const wildEntries: DexEntry[] = wildCreatures.map((w) => ({
  speciesId: w.id,
  name: w.name,
  types: w.types,
  category: "wild" as const,
  flavor: w.flavor,
  stats: w.baseStats,
  era: w.era,
  evolvesAtLevel: w.evolvesAtLevel ?? null,
}));

export const DEX_ENTRIES: DexEntry[] = [...starterEntries, ...wildEntries, ...regionalEntries, ...legendaryEntries];

export function getDexEntry(speciesId: string): DexEntry | undefined {
  return DEX_ENTRIES.find((e) => e.speciesId === speciesId);
}

export interface EvolutionLink {
  speciesId: string;
  name: string;
  level: number;
}

/** species id → the form it grows into, and at what level. Built from every line in the data. */
const NEXT_FORM = new Map<string, EvolutionLink>();
for (const line of starters) {
  line.stages.forEach((stage, index) => {
    const next = line.stages[index + 1];
    if (next && stage.evolvesAtLevel) {
      NEXT_FORM.set(stage.id, { speciesId: next.id, name: next.name, level: stage.evolvesAtLevel });
    }
  });
}
for (const species of [...wildCreatures, ...regionalVariants, ...legendaries]) {
  if (!species.evolvesInto || !species.evolvesAtLevel) continue;
  const next = DEX_ENTRIES.find((e) => e.speciesId === species.evolvesInto);
  if (next) NEXT_FORM.set(species.id, { speciesId: next.speciesId, name: next.name, level: species.evolvesAtLevel });
}

/** Where a species sits in its line: what it grew from and what it grows into, if anything. */
export function evolutionLinks(speciesId: string): { from?: EvolutionLink; into?: EvolutionLink } {
  const into = NEXT_FORM.get(speciesId);
  let from: EvolutionLink | undefined;
  for (const [fromId, link] of NEXT_FORM) {
    if (link.speciesId === speciesId) {
      from = { speciesId: fromId, name: getDexEntry(fromId)?.name ?? fromId, level: link.level };
      break;
    }
  }
  return { from, into };
}
