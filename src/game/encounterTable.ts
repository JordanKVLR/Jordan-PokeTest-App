import regionalVariantsData from "../data/regionalVariants.json";
import wildCreaturesData from "../data/wildCreatures.json";
import legendariesData from "../data/legendaries.json";
import { RegionalVariantsFileSchema, WildCreaturesFileSchema, LegendariesFileSchema } from "../data/schemas";
import {
  buildParticipant,
  buildStarterParticipant,
  otherStarterLines,
  randomWildLevel,
  randomLevelAtLeast,
  type BattleParticipant,
  type StarterLineName,
} from "./creatureFactory";
import type { BiomeType } from "./mapData";
import { spawnsIn } from "./spawning";

const regionalVariants = RegionalVariantsFileSchema.parse(regionalVariantsData).regionalVariants;
const wildCreatures = WildCreaturesFileSchema.parse(wildCreaturesData).wildCreatures;
const legendaries = LegendariesFileSchema.parse(legendariesData).legendaries;

/** legendaries.json only carries a flavor `signatureMove` name, not a real moveset — these are
 * the closest-fit moves from the actual move pool (src/data/moves.json), same placeholder
 * approach as the regional variants' movesets. */
const LEGENDARY_MOVE_IDS: Record<string, string[]> = {
  aegilord: ["metal_claw", "tackle"],
  megalithos: ["rock_throw", "tackle"],
  siroccus: ["sand_blast", "tackle"],
  aegilordan: ["cross_guard", "legion_charge", "metal_claw", "tackle"],
  megalithron: ["trilithon_slam", "hypogeum_echo", "rock_throw", "tackle"],
  siroccalis: ["signal_flare", "leviathan_coil", "gale_dive", "tackle"],
};

/**
 * The level at which each evolved species comes into existence, keyed by its own id.
 *
 * Every creature now sits in an evolution line, which means the roster contains plenty of
 * fully-grown forms. Without this they would roll on a stage-one table exactly as often as the
 * base forms do, and a starting player would meet a level-4 Granmastru — a creature that is
 * only supposed to exist at 42. A form is kept out of a zone's table until that zone's levels
 * have nearly caught up with where its line evolves.
 */
const EVOLVES_AT = new Map<string, number>();
for (const species of [...wildCreatures, ...regionalVariants, ...legendaries]) {
  if (species.evolvesInto && species.evolvesAtLevel) {
    EVOLVES_AT.set(species.evolvesInto, species.evolvesAtLevel);
  }
}

/** How far below its evolution level a form may still appear, so tables don't switch over abruptly. */
const EVOLVED_FORM_GRACE = 3;

/**
 * A first form's stats set how early it may turn up. A starter's first stage totals
 * STARTER_FIRST_STAGE_BST; a wild first form stronger than that waits in proportion to the gap,
 * so the opening roads are not full of creatures that simply outclass the partner you chose —
 * a 558-total Falkun belongs around level 25, not level 5.
 */
export const STARTER_FIRST_STAGE_BST = 430;
const LEVELS_PER_EXTRA_STAT_POINT = 0.2;

function statTotal(stats: { hp: number; atk: number; def: number; spatk: number; spdef: number; speed: number }): number {
  return stats.hp + stats.atk + stats.def + stats.spatk + stats.spdef + stats.speed;
}

/** The lowest zone level a species can appear at, from its line (evolved forms) or its stats (first forms). */
export function earliestWildLevel(species: { id: string; baseStats: Parameters<typeof statTotal>[0] }): number {
  const threshold = EVOLVES_AT.get(species.id);
  if (threshold !== undefined) return threshold - EVOLVED_FORM_GRACE;
  const excess = statTotal(species.baseStats) - STARTER_FIRST_STAGE_BST;
  return excess > 0 ? Math.ceil(excess * LEVELS_PER_EXTRA_STAT_POINT) : 0;
}

function availableAtLevel(species: { id: string; baseStats: Parameters<typeof statTotal>[0] }, baseLevel: number): boolean {
  return baseLevel >= earliestWildLevel(species);
}

/** Vanishingly rare relative to the rest of any biome's table (a single wild creature alone
 * outweighs all three legendaries combined) — this is the "you might see one, once in a long
 * while" tier, and unlike everything else here it's available from every biome rather than
 * being biome-locked, since there are only three of them across the whole game. */
const LEGENDARY_ENCOUNTER_WEIGHT = 0.3;

/** Which starter line's "other starter" wild encounter fits which biome, by loose elemental
 * association. Fire has no dedicated biome of its own, so it's paired with Rock (volcanic/
 * mountain flavor) rather than appearing everywhere. */
const STARTER_LINE_BIOME: Record<StarterLineName, BiomeType> = {
  Grass: "grass",
  Water: "water",
  Fire: "rock",
};

export interface EncounterOption {
  weight: number;
  build: (instanceId: string) => BattleParticipant;
}

export interface ZoneEncounterConfig {
  /** Center of the wild-level range for this zone/tier. */
  baseLevel: number;
  levelSpread?: number;
  /** Hard floor for the ultra-rare legendary encounter — see zones.ts. */
  legendaryMinLevel: number;
}

/**
 * Weighted wild-encounter pool for one specific biome tile (see mapData.ts's BiomeType) — each
 * biome only spawns wildCreatures.json/regionalVariants.json entries tagged with that exact
 * biome, so a Rock tile and a Water tile in the same zone (or in different zones) draw from
 * genuinely different species, not one shared list with only the level range shifting. The three
 * legendaries remain a vanishingly rare universal layer on top of every biome (see
 * LEGENDARY_ENCOUNTER_WEIGHT) rather than being biome-locked themselves, since there are too few
 * of them to meaningfully split four ways.
 */
export function buildBiomeEncounterTable(
  biome: BiomeType,
  playerLine: StarterLineName,
  config: ZoneEncounterConfig
): EncounterOption[] {
  const { baseLevel, levelSpread = 3 } = config;
  const table: EncounterOption[] = [];

  for (const wc of wildCreatures) {
    if (!spawnsIn(wc.biome, biome) || !availableAtLevel(wc, baseLevel)) continue;
    table.push({
      weight: 5,
      build: (id) =>
        buildParticipant(id, wc.id, wc.name, wc.types, wc.baseStats, randomWildLevel(baseLevel, levelSpread), wc.moveIds),
    });
  }

  for (const line of otherStarterLines(playerLine)) {
    if (STARTER_LINE_BIOME[line] !== biome) continue;
    table.push({
      weight: 3,
      build: (id) => buildStarterParticipant(line, randomWildLevel(baseLevel, levelSpread), id),
    });
  }

  for (const rv of regionalVariants) {
    if (!spawnsIn(rv.biome, biome) || !availableAtLevel(rv, baseLevel)) continue;
    table.push({
      weight: 1,
      build: (id) =>
        buildParticipant(id, rv.id, rv.name, rv.types, rv.baseStats, randomWildLevel(baseLevel, levelSpread), rv.moveIds),
    });
  }

  for (const legend of legendaries) {
    // Awakened legendaries are reached by evolving the one you caught, never found loose.
    if (EVOLVES_AT.has(legend.id)) continue;
    table.push({
      weight: LEGENDARY_ENCOUNTER_WEIGHT,
      build: (id) =>
        buildParticipant(
          id,
          legend.id,
          legend.name,
          legend.types,
          legend.baseStats,
          randomLevelAtLeast(config.legendaryMinLevel),
          LEGENDARY_MOVE_IDS[legend.id]
        ),
    });
  }

  return table;
}

/** Weighted random pick from an encounter table. */
export function rollEncounter(table: EncounterOption[], instanceId: string): BattleParticipant {
  const totalWeight = table.reduce((sum, o) => sum + o.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const option of table) {
    if (roll < option.weight) return option.build(instanceId);
    roll -= option.weight;
  }
  return table[table.length - 1].build(instanceId);
}
