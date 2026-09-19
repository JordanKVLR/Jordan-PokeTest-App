import startersData from "../data/starters.json";
import wildCreaturesData from "../data/wildCreatures.json";
import {
  StartersFileSchema,
  WildCreaturesFileSchema,
  type StarterLine,
  type StatBlock,
  type TypeName,
} from "../data/schemas";
import type { Creature } from "../engine/types";
import { NEUTRAL_STAT_STAGES } from "../engine/types";
import { STARTER_MOVESETS } from "./movesRepo";
import { effectiveStats } from "./progression";

const starters = StartersFileSchema.parse(startersData).starters;
const wildCreatures = WildCreaturesFileSchema.parse(wildCreaturesData).wildCreatures;

export type StarterLineName = "Grass" | "Fire" | "Water";

/** Every starter begins at this level (spec: "Every Starter begins at level 5"). */
export const STARTER_STARTING_LEVEL = 5;

export interface BattleParticipant {
  creature: Creature;
  moveIds: string[];
  displayName: string;
  /** Species reference stats (unscaled) — carried forward so a catch can persist the true base, not the level-scaled numbers. */
  baseStats: StatBlock;
}

/** Shared Creature-construction path for anything battle-ready: starters, regional variants, wild species. */
export function buildParticipant(
  instanceId: string,
  speciesId: string,
  displayName: string,
  types: TypeName[],
  baseStats: StatBlock,
  level: number,
  moveIds: string[]
): BattleParticipant {
  const stats = effectiveStats(baseStats, level);
  const creature: Creature = {
    id: instanceId,
    speciesId,
    level,
    types,
    stats,
    statStages: { ...NEUTRAL_STAT_STAGES },
    currentHp: stats.hp,
    status: "none",
    flinched: false,
    activeEffects: [],
  };
  return { creature, moveIds, displayName, baseStats: { ...baseStats } };
}

function getStarterLine(line: StarterLineName): StarterLine {
  const found = starters.find((s) => s.line === line);
  if (!found) throw new Error(`Unknown starter line: ${line}`);
  return found;
}

/** Builds a battle-ready stage-1 starter at the given level. Levels above the stage's own
 * evolvesAtLevel are handled separately by party.ts, which silently pre-evolves a freshly-built
 * PartyMember to whatever stage its level actually warrants (relevant for a caught wild "other
 * starter line" encounter above the evolution threshold — a starter always begins at
 * STARTER_STARTING_LEVEL, well below every line's first threshold, so this never applies there). */
export function buildStarterParticipant(
  line: StarterLineName,
  level: number,
  instanceId: string
): BattleParticipant {
  const starterLine = getStarterLine(line);
  const stageOne = starterLine.stages[0];
  return buildParticipant(instanceId, stageOne.id, stageOne.name, stageOne.types, stageOne.baseStats, level, STARTER_MOVESETS[line]);
}

export function getStarterStageOne(line: StarterLineName) {
  return getStarterLine(line).stages[0];
}

export interface EvolutionCandidate {
  nextSpeciesId: string;
  nextName: string;
  nextTypes: TypeName[];
  nextBaseStats: StatBlock;
}

/** Finds which starter line/stage a speciesId belongs to, if any. */
function findStarterStage(speciesId: string): { line: StarterLine; stageIndex: number } | null {
  for (const line of starters) {
    const stageIndex = line.stages.findIndex((s) => s.id === speciesId);
    if (stageIndex !== -1) return { line, stageIndex };
  }
  return null;
}

function findWildCreature(speciesId: string) {
  return wildCreatures.find((w) => w.id === speciesId) ?? null;
}

/** The species' own default display name (used to detect whether a party member has been given a
 * custom nickname — if its displayName no longer matches this, evolution must not overwrite it).
 * Null for a species from neither source, which simply means "never auto-rename it". */
export function defaultDisplayNameForSpecies(speciesId: string): string | null {
  const starter = findStarterStage(speciesId);
  if (starter) return starter.line.stages[starter.stageIndex].name;
  return findWildCreature(speciesId)?.name ?? null;
}

/**
 * Returns the next evolution stage for a species at the given level, or null if it doesn't
 * evolve here — a species with no line, an already-final stage, or a level below the threshold.
 *
 * Two kinds of line feed this: the three starter lines (ordered stages in starters.json) and
 * wild creatures that point at their next form with evolvesAtLevel/evolvesInto. Callers should
 * loop this (see party.ts) since a large level jump can cross more than one threshold at once.
 */
export function checkEvolution(speciesId: string, level: number): EvolutionCandidate | null {
  const starter = findStarterStage(speciesId);
  if (starter) {
    const { line, stageIndex } = starter;
    const currentStage = line.stages[stageIndex];
    if (currentStage.evolvesAtLevel === null || level < currentStage.evolvesAtLevel) return null;
    const nextStage = line.stages[stageIndex + 1];
    if (!nextStage) return null;
    return {
      nextSpeciesId: nextStage.id,
      nextName: nextStage.name,
      nextTypes: nextStage.types,
      nextBaseStats: nextStage.baseStats,
    };
  }

  const wild = findWildCreature(speciesId);
  if (!wild || !wild.evolvesAtLevel || !wild.evolvesInto) return null;
  if (level < wild.evolvesAtLevel) return null;
  const next = findWildCreature(wild.evolvesInto);
  if (!next) {
    // Data error rather than a silent no-op: an evolvesInto pointing nowhere means the line is
    // broken, and a creature that can never finish evolving is worth failing loudly over.
    throw new Error(`Creature "${speciesId}" evolves into unknown species "${wild.evolvesInto}"`);
  }
  return {
    nextSpeciesId: next.id,
    nextName: next.name,
    nextTypes: next.types,
    nextBaseStats: next.baseStats,
  };
}

export function otherStarterLines(line: StarterLineName): StarterLineName[] {
  return (["Grass", "Fire", "Water"] as StarterLineName[]).filter((l) => l !== line);
}

/** Picks a random wild-encounter line so the same starter choice doesn't always face the same opponent. */
export function randomOtherStarterLine(line: StarterLineName): StarterLineName {
  const options = otherStarterLines(line);
  return options[Math.floor(Math.random() * options.length)];
}

/** Wild-encounter level with +/- spread around a base, floored at 1. */
export function randomWildLevel(baseLevel: number, spread = 3): number {
  const offset = Math.floor(Math.random() * (spread * 2 + 1)) - spread;
  return Math.max(1, baseLevel + offset);
}

/** Like randomWildLevel, but only ever rolls upward from a hard floor — used for the rare
 * legendary encounter, which should never dip below its zone's minimum level. */
export function randomLevelAtLeast(minLevel: number, spread = 5): number {
  return minLevel + Math.floor(Math.random() * (spread + 1));
}

export const ALL_STARTER_LINES = starters.map((s) => s.line);
