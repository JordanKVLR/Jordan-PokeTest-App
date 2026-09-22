import { z } from "zod";

export const TypeNameSchema = z.enum([
  "Steel",
  "Ghost",
  "Psychic",
  "Rock",
  "Water",
  "Fire",
  "Grass",
  "Electric",
  "Ground",
  "Flying",
  "Fighting",
  "Fairy",
  "Ice",
  "Bug",
  "Poison",
  "Normal",
  "Dark",
  "Dragon",
]);

/** Matches mapData.ts's BiomeType — kept as a separate literal union here (rather than importing
 * from src/game/) so src/data/ has no dependency on src/game/. */
export const BiomeSchema = z.enum(["grass", "rock", "water", "sand"]);

/**
 * Where a creature spawns. Everything is tied to one terrain except the Normal types, which
 * are the island's ordinary animals — the harbour cat, the rabbit hound, the rock dove — and
 * belong to no single landscape, so they roll on every biome's table.
 */
export const SpawnBiomeSchema = z.enum(["grass", "rock", "water", "sand", "any"]);

/** Evolution pointer shared by every species file: the level, and what it turns into. */
const EvolutionFields = {
  /** Level this creature evolves at. Omitted (or null) means it is a final form. */
  evolvesAtLevel: z.number().int().positive().nullable().optional(),
  /** Species id this evolves into; required whenever evolvesAtLevel is set. */
  evolvesInto: z.string().nullable().optional(),
};

export const StatBlockSchema = z.object({
  hp: z.number().int().positive(),
  atk: z.number().int().positive(),
  def: z.number().int().positive(),
  spatk: z.number().int().positive(),
  spdef: z.number().int().positive(),
  speed: z.number().int().positive(),
});

export const StarterStageSchema = z.object({
  id: z.string(),
  name: z.string(),
  stage: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  types: z.array(TypeNameSchema).min(1).max(2),
  evolvesAtLevel: z.number().int().positive().nullable(),
  /** This stage's own reference stat block (see progression.ts's "level-50 reference" scaling) —
   * every stage has its own now, not just the final one, so evolving actually changes stats
   * rather than just the displayed name/species. */
  baseStats: StatBlockSchema,
});

export const StarterLineSchema = z.object({
  line: z.enum(["Grass", "Fire", "Water"]),
  stages: z.array(StarterStageSchema).length(3),
  signatureMove: z.string(),
  rideAbility: z.string().optional(),
});

export const StartersFileSchema = z.object({
  starters: z.array(StarterLineSchema),
});

export const LegendarySchema = z.object({
  id: z.string(),
  name: z.string(),
  types: z.array(TypeNameSchema).min(1).max(2),
  aesthetic: z.string(),
  baseStats: StatBlockSchema,
  signatureMove: z.string(),
  storyFlagRequired: z.string(),
  ...EvolutionFields,
});

export const LegendariesFileSchema = z.object({
  legendaries: z.array(LegendarySchema),
});

export const RegionalVariantSchema = z.object({
  id: z.string(),
  name: z.string(),
  types: z.array(TypeNameSchema).min(1).max(2),
  flavor: z.string(),
  baseStats: StatBlockSchema,
  moveIds: z.array(z.string()).min(1).max(4),
  biome: BiomeSchema,
  ...EvolutionFields,
});

export const RegionalVariantsFileSchema = z.object({
  regionalVariants: z.array(RegionalVariantSchema),
});

export const TypeChartFileSchema = z.object({
  types: z.array(z.string()),
  coreTypes: z.array(z.string()),
  referenceOnlyTypes: z.array(z.string()),
  matrix: z.record(z.string(), z.record(z.string(), z.number())),
});

/** A stat stage nudge, applied to whoever used the move or to the creature on the far side. */
export const StatChangeSchema = z.object({
  target: z.enum(["self", "opponent"]),
  stat: z.enum(["atk", "def", "spatk", "spdef", "speed", "accuracy", "evasion"]),
  /** Stages to shift, clamped to -6..+6 in the engine. Negative lowers. */
  stages: z.number().int(),
  /** Percentage chance of applying. 100 for a status move's whole point; lower for the
   * secondary effect riding along on a damaging move. */
  chance: z.number().int().min(1).max(100).default(100),
});

export const MoveDataSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: TypeNameSchema,
  /** "status" moves deal no damage and exist purely for their statChanges. */
  category: z.enum(["physical", "special", "status"]),
  /** 0 for status moves. */
  power: z.number().int().nonnegative(),
  accuracy: z.number().int().min(1).max(100),
  /** How many times it can be used before the party needs to rest. Heavy hitters get few. */
  pp: z.number().int().positive(),
  basePriority: z.number().int(),
  statChanges: z.array(StatChangeSchema).optional(),
});

export const MovesFileSchema = z.object({
  moves: z.array(MoveDataSchema),
});

export const ItemCategorySchema = z.enum(["balls", "medicine", "key_items", "battle_items"]);

export const ItemDataSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: ItemCategorySchema,
  description: z.string(),
  catchMultiplier: z.number().positive().optional(),
  /** What "Use Item" does with this item, in and out of battle. Absent = not directly usable. */
  effect: z.enum(["heal", "level_up"]).optional(),
  /** Flat HP restored by a "heal" item (medicine). */
  healAmount: z.number().int().positive().optional(),
  startingQuantity: z.number().int().nonnegative().default(0),
  /** Absent = not sold in the Shop (e.g. key items, or rare drops like Kinnie). */
  price: z.number().int().positive().optional(),
});

export const ItemsFileSchema = z.object({
  items: z.array(ItemDataSchema),
});

/**
 * Which layer of Maltese history a creature belongs to. The islands have been continuously
 * inhabited for seven millennia and every occupier left something behind, so the roster is
 * organised the way the archaeology is: by era. "wild" covers the creatures that are just
 * fauna, belonging to no particular period.
 */
export const EraSchema = z.enum([
  "wild",
  "neolithic",
  "bronze",
  "phoenician",
  "roman",
  "arab",
  "knights",
  "ottoman",
  "british",
]);

export const WildCreatureSchema = z.object({
  id: z.string(),
  name: z.string(),
  types: z.array(TypeNameSchema).min(1).max(2),
  flavor: z.string(),
  baseStats: StatBlockSchema,
  moveIds: z.array(z.string()).min(1).max(4),
  biome: SpawnBiomeSchema,
  era: EraSchema.default("wild"),
  ...EvolutionFields,
});

export const LearnsetEntrySchema = z.object({
  level: z.number().int().positive(),
  moveId: z.string(),
});

/** speciesId -> the moves it gains as it levels. */
export const LearnsetsFileSchema = z.object({
  learnsets: z.record(z.string(), z.array(LearnsetEntrySchema)),
});

export const WildCreaturesFileSchema = z.object({
  wildCreatures: z.array(WildCreatureSchema),
});

export type Biome = z.infer<typeof BiomeSchema>;
export type SpawnBiome = z.infer<typeof SpawnBiomeSchema>;
export type TypeName = z.infer<typeof TypeNameSchema>;
export type StatBlock = z.infer<typeof StatBlockSchema>;
export type StarterLine = z.infer<typeof StarterLineSchema>;
export type StarterStage = z.infer<typeof StarterStageSchema>;
export type Legendary = z.infer<typeof LegendarySchema>;
export type RegionalVariant = z.infer<typeof RegionalVariantSchema>;
export type TypeChartFile = z.infer<typeof TypeChartFileSchema>;
export type MoveData = z.infer<typeof MoveDataSchema>;
export type ItemCategory = z.infer<typeof ItemCategorySchema>;
export type ItemData = z.infer<typeof ItemDataSchema>;
export type WildCreature = z.infer<typeof WildCreatureSchema>;
export type Era = z.infer<typeof EraSchema>;
