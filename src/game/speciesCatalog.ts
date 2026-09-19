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
    signatureMove: stage.stage === 3 ? line.signatureMove : undefined,
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
