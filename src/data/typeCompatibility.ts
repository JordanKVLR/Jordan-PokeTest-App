import type { TypeName } from "./schemas";

/**
 * Which pairs of types may never appear on the same creature.
 *
 * A dual-typed creature is meant to read as one idea, not two contradictory ones. There are
 * two reasons a pair lands on this list:
 *
 * 1. **Immunity pairs.** The type chart gives eight one-way immunities, and each one describes
 *    a relationship of "this does not exist for that". Ground attacks cannot touch Flying, so a
 *    Ground/Flying creature is simultaneously a thing of the earth and a thing that is not of
 *    the earth. The same goes for Ghost/Normal, Psychic/Dark, Electric/Ground, Fighting/Ghost,
 *    Poison/Steel and Dragon/Fairy. These are derived from type_chart.json's zeroes, and a test
 *    checks they stay in sync with it.
 *
 * 2. **Elemental opposites.** Fire and Water, Fire and Ice, Water and Electric, Fire and Grass,
 *    Grass and Steel. Nothing in the chart forbids these, but a creature cannot plausibly be
 *    made of both a flame and the thing that puts it out.
 *
 * Enforced over the entire roster by src/data/__tests__/roster.test.ts.
 */
export const CONFLICTING_TYPE_PAIRS: ReadonlyArray<readonly [TypeName, TypeName]> = [
  // Immunities — see type_chart.json
  ["Ghost", "Normal"],
  ["Psychic", "Dark"],
  ["Electric", "Ground"],
  ["Ground", "Flying"],
  ["Fighting", "Ghost"],
  ["Poison", "Steel"],
  ["Dragon", "Fairy"],
  // Elemental opposites
  ["Fire", "Water"],
  ["Fire", "Ice"],
  ["Fire", "Grass"],
  ["Water", "Electric"],
  ["Grass", "Steel"],
];

/** Both orderings of every pair, so lookups don't have to care which type came first. */
const CONFLICT_KEYS = new Set(CONFLICTING_TYPE_PAIRS.flatMap(([a, b]) => [`${a}|${b}`, `${b}|${a}`]));

/** True when these two types must never share a creature. Order-independent. */
export function typesConflict(a: TypeName, b: TypeName): boolean {
  return CONFLICT_KEYS.has(`${a}|${b}`);
}

/**
 * Why this type list is invalid, or null if it is fine. Creatures carry one or two types —
 * never three — and the two may not be a conflicting pair.
 */
export function describeTypeProblem(types: readonly TypeName[]): string | null {
  if (types.length === 0) return "has no types";
  if (types.length > 2) return `has ${types.length} types (${types.join("/")}) — the limit is 2`;
  if (types.length === 2) {
    if (types[0] === types[1]) return `lists ${types[0]} twice`;
    if (typesConflict(types[0], types[1])) return `pairs conflicting types ${types[0]}/${types[1]}`;
  }
  return null;
}
