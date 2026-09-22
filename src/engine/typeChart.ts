import typeChartData from "../data/type_chart.json";
import { TypeChartFileSchema, type TypeName } from "../data/schemas";

const parsed = TypeChartFileSchema.parse(typeChartData);
const matrix = parsed.matrix;

/**
 * Effectiveness of a single attacking type against a single defending type.
 * Defaults to 1 (neutral) for any pair not present in the chart.
 *
 * The matrix is an 18-type effectiveness chart (0x/0.5x/1x/2x) that started from the mainline
 * relationships and has since been tuned against this game's own roster — see
 * src/data/__tests__/typeChart.test.ts, which holds it to the invariants that matter here:
 * every type has something that beats it, something it shrugs off, and enough reach across the
 * creatures a player will actually meet to be worth carrying.
 */
export function getSingleTypeMultiplier(attackType: TypeName, defenderType: TypeName): number {
  return matrix[attackType]?.[defenderType] ?? 1;
}

/**
 * Combined effectiveness of an attacking type against a (possibly dual-typed)
 * defender: the product across all of the defender's types. This is where the
 * spec's 0/0.5/1/2/4 range comes from (e.g. 2 * 2 = 4 for a double-weak dual type).
 */
export function getTypeMultiplier(attackType: TypeName, defenderTypes: TypeName[]): number {
  return defenderTypes.reduce((mult, defType) => mult * getSingleTypeMultiplier(attackType, defType), 1);
}


export const ALL_TYPES: TypeName[] = parsed.types as TypeName[];

export interface TypeMatchups {
  /** Attacking with this type: double damage against these. */
  strongAgainst: TypeName[];
  /** Attacking with this type: half damage against these. */
  weakAgainst: TypeName[];
  /** Attacking with this type: no damage at all against these. */
  noEffectAgainst: TypeName[];
  /** Defending as this type: these attack types hit for double. */
  weakTo: TypeName[];
  /** Defending as this type: these attack types are halved. */
  resists: TypeName[];
  /** Defending as this type: these attack types cannot touch it. */
  immuneTo: TypeName[];
}

/** Everything a player needs to know about one type, in both directions. */
export function typeMatchups(type: TypeName): TypeMatchups {
  const attack = (test: (v: number) => boolean) => ALL_TYPES.filter((d) => test(getSingleTypeMultiplier(type, d)));
  const defend = (test: (v: number) => boolean) => ALL_TYPES.filter((a) => test(getSingleTypeMultiplier(a, type)));
  return {
    strongAgainst: attack((v) => v > 1),
    weakAgainst: attack((v) => v > 0 && v < 1),
    noEffectAgainst: attack((v) => v === 0),
    weakTo: defend((v) => v > 1),
    resists: defend((v) => v > 0 && v < 1),
    immuneTo: defend((v) => v === 0),
  };
}
