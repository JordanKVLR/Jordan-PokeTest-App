import typeChartData from "../type_chart.json";
import startersData from "../starters.json";
import wildCreaturesData from "../wildCreatures.json";
import regionalVariantsData from "../regionalVariants.json";
import legendariesData from "../legendaries.json";
import {
  StartersFileSchema,
  WildCreaturesFileSchema,
  RegionalVariantsFileSchema,
  LegendariesFileSchema,
  TypeNameSchema,
  type TypeName,
} from "../schemas";

const TYPES = TypeNameSchema.options;
const matrix = typeChartData.matrix as Record<string, Record<string, number>>;

const ROSTER: TypeName[][] = [
  ...StartersFileSchema.parse(startersData).starters.flatMap((l) => l.stages.map((s) => s.types)),
  ...WildCreaturesFileSchema.parse(wildCreaturesData).wildCreatures.map((c) => c.types),
  ...RegionalVariantsFileSchema.parse(regionalVariantsData).regionalVariants.map((c) => c.types),
  ...LegendariesFileSchema.parse(legendariesData).legendaries.map((c) => c.types),
];

const superEffectiveAgainst = (t: TypeName) => TYPES.filter((d) => matrix[t][d] > 1);
const weaknessesOf = (t: TypeName) => TYPES.filter((a) => matrix[a][t] > 1);
const defencesOf = (t: TypeName) => TYPES.filter((a) => matrix[a][t] < 1);

/** How many creatures on the roster an attack of this type would hit for extra damage. */
function rosterReach(attackType: TypeName): number {
  return ROSTER.filter((types) => types.reduce((m, t) => m * matrix[attackType][t], 1) > 1).length;
}

describe("type chart", () => {
  it("scores every attacker against every defender", () => {
    for (const attacker of TYPES) {
      expect({ attacker, present: Boolean(matrix[attacker]) }).toEqual({ attacker, present: true });
      for (const defender of TYPES) {
        const value = matrix[attacker][defender];
        expect({ attacker, defender, value }).toEqual({
          attacker,
          defender,
          value: expect.any(Number),
        });
        expect([0, 0.5, 1, 2]).toContain(value);
      }
    }
  });

  it("gives every type at least one thing that beats it", () => {
    const invulnerable = TYPES.filter((t) => weaknessesOf(t).length === 0);
    expect(invulnerable).toEqual([]);
  });

  it("gives every type at least one thing it shrugs off", () => {
    // Counting immunities: Normal's defence against Ghost is total rather than partial.
    const defenceless = TYPES.filter((t) => defencesOf(t).length === 0);
    expect(defenceless).toEqual([]);
  });

  it("makes every type except Normal super-effective against something", () => {
    // Normal is the baseline the rest of the chart is measured against — it is deliberately
    // never super-effective, and in exchange almost nothing resists it. Every other type has
    // to actually beat something, or its moves are dead weight in a player's hands.
    const toothless = TYPES.filter((t) => t !== "Normal" && superEffectiveAgainst(t).length === 0);
    expect(toothless).toEqual([]);
  });

  it("gives every attacking type real reach across the roster it will actually meet", () => {
    // A type can look fine on the chart and still be useless if the creatures it beats are
    // rare. Ice was the case that prompted this: strong on paper against Grass/Ground/Flying/
    // Dragon, but resisted by Water and Steel, which the roster is full of.
    const floor = Math.round(ROSTER.length * 0.08);
    const weak = TYPES.filter((t) => t !== "Normal" && rosterReach(t) < floor).map(
      (t) => `${t} hits only ${rosterReach(t)} of ${ROSTER.length}`
    );
    expect(weak).toEqual([]);
  });

  it("no longer leaves Ice the worst type in the game", () => {
    // Ice used to resist only itself while four types hit it hard, which made an Ice creature
    // unplayable however good its offence looked.
    expect(superEffectiveAgainst("Ice")).toEqual(
      expect.arrayContaining(["Rock", "Grass", "Ground", "Flying", "Dragon"])
    );
    expect(defencesOf("Ice")).toEqual(expect.arrayContaining(["Normal", "Grass", "Flying", "Ice"]));
    expect(weaknessesOf("Ice").length).toBeLessThanOrEqual(3);
    expect(rosterReach("Ice")).toBeGreaterThan(ROSTER.length * 0.25);
  });

  it("keeps the matchups the game's design calls for", () => {
    // Asked for by name, and not to be traded away when the chart is rebalanced. An earlier
    // Ice rebalance quietly dropped Rock's resistance to Normal to compensate elsewhere; this
    // exists so that can't happen silently again.
    const resists = (defender: TypeName, attacker: TypeName) => matrix[attacker][defender] < 1;
    // Hard things shrug off plain blows and each other: stone against stone, stone against a fist of nothing special.
    expect(resists("Rock", "Normal")).toBe(true);
    expect(resists("Rock", "Rock")).toBe(true);
    expect(resists("Steel", "Normal")).toBe(true);
    // Ice stands up to ordinary blows and to plants.
    expect(resists("Ice", "Normal")).toBe(true);
    expect(resists("Ice", "Grass")).toBe(true);
  });

  it("keeps the eight immunities the compatibility rules are derived from", () => {
    const immunities = [
      ["Ghost", "Normal"], ["Normal", "Ghost"], ["Psychic", "Dark"], ["Electric", "Ground"],
      ["Ground", "Flying"], ["Fighting", "Ghost"], ["Poison", "Steel"], ["Dragon", "Fairy"],
    ] as const;
    for (const [attacker, defender] of immunities) {
      expect({ pair: `${attacker}->${defender}`, value: matrix[attacker][defender] }).toEqual({
        pair: `${attacker}->${defender}`,
        value: 0,
      });
    }
  });

  it("does not let any one type run away with the chart", () => {
    const reaches = TYPES.map((t) => rosterReach(t));
    const best = Math.max(...reaches);
    // The strongest attacking type should not beat more than half the roster outright.
    expect(best).toBeLessThanOrEqual(ROSTER.length * 0.5);
  });
});
