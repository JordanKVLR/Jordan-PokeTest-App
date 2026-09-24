import type { Creature } from "../engine/types";
import { NEUTRAL_STAT_STAGES } from "../engine/types";
import type { StatBlock, TypeName } from "../data/schemas";
import type { BattleParticipant } from "./creatureFactory";
import { checkEvolution, defaultDisplayNameForSpecies } from "./creatureFactory";
import { effectiveStats, xpToNextLevel } from "./progression";
import { getMove } from "./movesRepo";
import { movesLearnedBetween } from "./learnsetsRepo";

export type PartySourceCategory = "starter" | "regional" | "wild";

export interface PartyMember {
  uid: string;
  speciesId: string;
  displayName: string;
  types: TypeName[];
  level: number;
  xp: number;
  /** Species reference stats (unscaled) — use effectiveStats()/partyMemberStats() for battle-ready numbers. */
  baseStats: StatBlock;
  currentHp: number;
  moveIds: string[];
  /** Remaining uses per move id. Moves missing a key are treated as full (covers saves from
   * before PP existed, and any move added to a creature after it was caught). */
  movePp?: Record<string, number>;
  sourceCategory: PartySourceCategory;
}

/** Describes an evolution that just happened, for the UI to play a reveal animation. */
export interface EvolutionReveal {
  oldSpeciesId: string;
  oldDisplayName: string;
  oldTypes: TypeName[];
  newSpeciesId: string;
  newDisplayName: string;
  newTypes: TypeName[];
}

interface EvolutionChainResult {
  speciesId: string;
  displayName: string;
  types: TypeName[];
  baseStats: StatBlock;
  evolution: EvolutionReveal | null;
}

/**
 * Repeatedly applies checkEvolution starting from (speciesId, displayName, types, baseStats) at
 * the given level, in case a big level jump crosses more than one evolution threshold at once —
 * the reveal (if any) always describes the true starting form -> the true final form, skipping
 * over an intermediate stage's reveal rather than playing one per hop.
 *
 * A custom nickname (displayName no longer matching the current stage's own default name) is
 * preserved through evolution rather than overwritten — only an un-nicknamed member's displayName
 * follows the species name, matching how nicknames survive evolution in the mainline games.
 */
function resolveEvolutionChain(
  speciesId: string,
  displayName: string,
  types: TypeName[],
  baseStats: StatBlock,
  level: number
): EvolutionChainResult {
  const wasDefaultName = defaultDisplayNameForSpecies(speciesId) === displayName;
  const startSpeciesId = speciesId;
  const startDisplayName = displayName;
  const startTypes = types;
  let evolved = false;

  for (;;) {
    const candidate = checkEvolution(speciesId, level);
    if (!candidate) break;
    speciesId = candidate.nextSpeciesId;
    types = candidate.nextTypes;
    baseStats = candidate.nextBaseStats;
    if (wasDefaultName) displayName = candidate.nextName;
    evolved = true;
  }

  return {
    speciesId,
    displayName,
    types,
    baseStats,
    evolution: evolved
      ? {
          oldSpeciesId: startSpeciesId,
          oldDisplayName: startDisplayName,
          oldTypes: startTypes,
          newSpeciesId: speciesId,
          newDisplayName: displayName,
          newTypes: types,
        }
      : null,
  };
}

export function partyMemberFromParticipant(
  participant: BattleParticipant,
  sourceCategory: PartySourceCategory
): PartyMember {
  const level = participant.creature.level;
  // Silently pre-evolve on creation — relevant for a caught wild "other starter line" encounter
  // already above its evolution threshold; a starter itself always begins well below every
  // line's first threshold, so this is a no-op there. No reveal animation plays here: the
  // creature already *is* whatever stage its level warrants, there's nothing to "transform" from.
  const resolved = resolveEvolutionChain(
    participant.creature.speciesId,
    participant.displayName,
    participant.creature.types,
    participant.baseStats,
    level
  );
  // currentHp on the incoming participant may already be partial (a wild creature caught
  // mid-battle, HP down from the fight) — a pre-evolution here must carry that damage forward
  // proportionally (same partial-top-up rule as a normal level-up), not silently top it back up.
  const oldMaxHp = effectiveStats(participant.baseStats, level).hp;
  const newMaxHp = effectiveStats(resolved.baseStats, level).hp;
  const currentHp = resolved.evolution
    ? Math.min(newMaxHp, participant.creature.currentHp + (newMaxHp - oldMaxHp))
    : participant.creature.currentHp;
  return {
    uid: participant.creature.id,
    speciesId: resolved.speciesId,
    displayName: resolved.displayName,
    types: resolved.types,
    level,
    xp: 0,
    baseStats: { ...resolved.baseStats },
    currentHp,
    moveIds: participant.moveIds,
    movePp: fullPpFor(participant.moveIds),
    sourceCategory,
  };
}

/** Full PP for every move a member knows — the state it leaves a Healing Centre in. */
export function fullPpFor(moveIds: string[]): Record<string, number> {
  return Object.fromEntries(moveIds.map((id) => [id, getMove(id).pp]));
}

/** Remaining PP for one move, defaulting to full when the save predates PP tracking. */
export function remainingPp(member: PartyMember, moveId: string): number {
  return member.movePp?.[moveId] ?? getMove(moveId).pp;
}

/** True when every move this member knows is spent, so only Scrap is left. */
export function isOutOfPp(member: PartyMember): boolean {
  return member.moveIds.every((id) => remainingPp(member, id) <= 0);
}

/** Level-scaled effective stats for a party member (see progression.ts). */
export function partyMemberStats(member: PartyMember): StatBlock {
  return effectiveStats(member.baseStats, member.level);
}

/** Rebuilds a battle-ready engine Creature from a persisted party member. */
export function creatureFromPartyMember(member: PartyMember): Creature {
  const stats = partyMemberStats(member);
  return {
    id: member.uid,
    speciesId: member.speciesId,
    level: member.level,
    types: member.types,
    stats,
    statStages: { ...NEUTRAL_STAT_STAGES },
    currentHp: Math.min(member.currentHp, stats.hp),
    status: "none",
    flinched: false,
    activeEffects: [],
  };
}

export const MAX_MOVES = 4;

/** What a level-up did to a creature's moveset. */
export interface MoveLearnResult {
  /** Moves added straight into a free slot. */
  learned: string[];
  /** Moves that had nowhere to go because all four slots are full — the UI offers a swap. */
  pending: string[];
}

/**
 * Adds every move unlocked between two levels, filling free slots first. Anything that
 * doesn't fit is handed back as `pending` rather than silently dropped or auto-overwriting
 * a move the player chose to keep.
 */
function learnMovesForLevelUp(
  speciesId: string,
  moveIds: string[],
  movePp: Record<string, number> | undefined,
  fromLevel: number,
  toLevel: number
): { moveIds: string[]; movePp: Record<string, number>; result: MoveLearnResult } {
  const unlocked = movesLearnedBetween(speciesId, fromLevel, toLevel);
  const nextMoves = [...moveIds];
  const nextPp = { ...(movePp ?? fullPpFor(moveIds)) };
  const learned: string[] = [];
  const pending: string[] = [];

  for (const moveId of unlocked) {
    if (nextMoves.includes(moveId)) continue;
    if (nextMoves.length < MAX_MOVES) {
      nextMoves.push(moveId);
      nextPp[moveId] = getMove(moveId).pp;
      learned.push(moveId);
    } else {
      pending.push(moveId);
    }
  }
  return { moveIds: nextMoves, movePp: nextPp, result: { learned, pending } };
}

export interface LevelUpResult {
  member: PartyMember;
  leveledUp: boolean;
  newLevel: number;
  levelsGained: number;
  /** Set when this level-up crossed a starter's evolvesAtLevel threshold — the UI should play an
   * evolution reveal before (or alongside) the usual level-up stat comparison. */
  evolution: EvolutionReveal | null;
  /** Moves gained (and moves that need a slot freed) as a result of this level-up. */
  moveLearning: MoveLearnResult;
}

/**
 * Adds XP to a party member, applying as many level-ups as the XP covers.
 * On level-up, max HP grows (via the stat curve) and current HP grows by
 * the same amount — a partial top-up, not a full heal, since levelling up
 * mid-battle shouldn't erase damage already taken. If the new level crosses
 * an evolution threshold, species/types/baseStats update too (see
 * resolveEvolutionChain) before the new max HP is computed, so the HP gain
 * reflects the evolved form's stats, not the pre-evolution ones.
 */
export function addExperience(member: PartyMember, xpGained: number): LevelUpResult {
  let xp = member.xp + xpGained;
  let level = member.level;
  let levelsGained = 0;
  const prevMaxHp = effectiveStats(member.baseStats, level).hp;

  while (xp >= xpToNextLevel(level)) {
    xp -= xpToNextLevel(level);
    level += 1;
    levelsGained += 1;
  }

  const resolved = resolveEvolutionChain(member.speciesId, member.displayName, member.types, member.baseStats, level);
  const newMaxHp = effectiveStats(resolved.baseStats, level).hp;
  const hpGain = newMaxHp - prevMaxHp;
  const moves = learnMovesForLevelUp(resolved.speciesId, member.moveIds, member.movePp, member.level, level);

  return {
    member: {
      ...member,
      xp,
      level,
      speciesId: resolved.speciesId,
      displayName: resolved.displayName,
      types: resolved.types,
      baseStats: resolved.baseStats,
      moveIds: moves.moveIds,
      movePp: moves.movePp,
      currentHp: levelsGained > 0 ? Math.min(newMaxHp, member.currentHp + hpGain) : member.currentHp,
    },
    leveledUp: levelsGained > 0,
    newLevel: level,
    levelsGained,
    evolution: resolved.evolution,
    moveLearning: moves.result,
  };
}

export interface DirectLevelUpResult {
  member: PartyMember;
  evolution: EvolutionReveal | null;
  moveLearning: MoveLearnResult;
}

/** Direct +1 level (e.g. the Kinnie item) — same partial-HP-top-up and evolution-check rules as
 * a level-up from XP (see addExperience). */
export function applyLevelUp(member: PartyMember): DirectLevelUpResult {
  const prevMaxHp = effectiveStats(member.baseStats, member.level).hp;
  const newLevel = member.level + 1;
  const resolved = resolveEvolutionChain(member.speciesId, member.displayName, member.types, member.baseStats, newLevel);
  const newMaxHp = effectiveStats(resolved.baseStats, newLevel).hp;
  const hpGain = newMaxHp - prevMaxHp;
  const moves = learnMovesForLevelUp(resolved.speciesId, member.moveIds, member.movePp, member.level, newLevel);
  return {
    member: {
      ...member,
      level: newLevel,
      speciesId: resolved.speciesId,
      displayName: resolved.displayName,
      types: resolved.types,
      baseStats: resolved.baseStats,
      moveIds: moves.moveIds,
      movePp: moves.movePp,
      currentHp: Math.min(newMaxHp, member.currentHp + hpGain),
    },
    evolution: resolved.evolution,
    moveLearning: moves.result,
  };
}
