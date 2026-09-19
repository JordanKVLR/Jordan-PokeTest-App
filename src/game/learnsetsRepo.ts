import learnsetsData from "../data/learnsets.json";
import { LearnsetsFileSchema } from "../data/schemas";

const learnsets = LearnsetsFileSchema.parse(learnsetsData).learnsets;

export interface LearnedMove {
  level: number;
  moveId: string;
}

/** Every move this species picks up by levelling, in level order. */
export function learnsetFor(speciesId: string): LearnedMove[] {
  return learnsets[speciesId] ?? [];
}

/**
 * Moves unlocked by growing from `fromLevel` to `toLevel` — exclusive of the old level,
 * inclusive of the new one, so a single level-up reports exactly what that level grants and
 * a multi-level XP jump reports everything it passed through.
 *
 * Evolving mid-jump doesn't change which species' learnset applies: the caller passes the
 * species the creature *ends up as*, so an evolved form's late moves are what it learns.
 */
export function movesLearnedBetween(speciesId: string, fromLevel: number, toLevel: number): string[] {
  if (toLevel <= fromLevel) return [];
  return learnsetFor(speciesId)
    .filter((entry) => entry.level > fromLevel && entry.level <= toLevel)
    .map((entry) => entry.moveId);
}

/** Moves a species would already know at this level — used when building a creature that
 * starts partway up its curve (a trainer's party, a high-level wild encounter). */
export function movesKnownAtLevel(speciesId: string, level: number, baseMoves: string[]): string[] {
  const learned = learnsetFor(speciesId)
    .filter((entry) => entry.level <= level)
    .map((entry) => entry.moveId);
  const combined: string[] = [];
  // Later unlocks win the slot fight: keep the most recent four, but never drop every base
  // move, so a creature always has something to open with.
  for (const id of [...baseMoves, ...learned]) {
    if (!combined.includes(id)) combined.push(id);
  }
  return combined.slice(-4);
}
