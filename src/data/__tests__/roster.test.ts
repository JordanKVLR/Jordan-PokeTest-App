import startersData from "../starters.json";
import wildCreaturesData from "../wildCreatures.json";
import regionalVariantsData from "../regionalVariants.json";
import legendariesData from "../legendaries.json";
import learnsetsData from "../learnsets.json";
import typeChartData from "../type_chart.json";
import {
  StartersFileSchema,
  WildCreaturesFileSchema,
  RegionalVariantsFileSchema,
  LegendariesFileSchema,
  LearnsetsFileSchema,
  TypeNameSchema,
  type TypeName,
} from "../schemas";
import { CONFLICTING_TYPE_PAIRS, describeTypeProblem, typesConflict } from "../typeCompatibility";

const starters = StartersFileSchema.parse(startersData).starters;
const wild = WildCreaturesFileSchema.parse(wildCreaturesData).wildCreatures;
const variants = RegionalVariantsFileSchema.parse(regionalVariantsData).regionalVariants;
const legendaries = LegendariesFileSchema.parse(legendariesData).legendaries;
const learnsets = LearnsetsFileSchema.parse(learnsetsData).learnsets;

interface Species {
  id: string;
  name: string;
  types: TypeName[];
  evolvesAtLevel?: number | null;
  evolvesInto?: string | null;
}

/** Every species in the game, flattened — the roster rules apply to all of them equally. */
const ALL: Species[] = [
  ...starters.flatMap((line) =>
    line.stages.map((s, i) => ({
      id: s.id,
      name: s.name,
      types: s.types,
      evolvesAtLevel: s.evolvesAtLevel,
      // Starter lines are ordered arrays rather than id pointers.
      evolvesInto: s.evolvesAtLevel ? line.stages[i + 1]?.id ?? null : null,
    }))
  ),
  ...wild,
  ...variants,
  ...legendaries,
];

const BY_ID = new Map(ALL.map((s) => [s.id, s]));

describe("roster integrity", () => {
  it("has no duplicate species ids", () => {
    expect(BY_ID.size).toBe(ALL.length);
  });

  it("gives every creature one or two non-conflicting types", () => {
    const problems = ALL.map((s) => {
      const problem = describeTypeProblem(s.types);
      return problem ? `${s.name} (${s.id}) ${problem}` : null;
    }).filter(Boolean);
    expect(problems).toEqual([]);
  });

  it("derives its immunity conflicts from the real type chart", () => {
    const chartImmunities = new Set<string>();
    for (const [attacker, row] of Object.entries(typeChartData.matrix)) {
      for (const [defender, multiplier] of Object.entries(row)) {
        if (multiplier === 0) chartImmunities.add([attacker, defender].sort().join("|"));
      }
    }
    // Every zero in the chart must be declared a conflict; the list may add thematic
    // opposites on top, but it must never silently drop an immunity pair.
    for (const key of chartImmunities) {
      const [a, b] = key.split("|") as [TypeName, TypeName];
      expect({ pair: key, conflicts: typesConflict(a, b) }).toEqual({ pair: key, conflicts: true });
    }
  });

  it("lists each conflicting pair only once, with valid type names", () => {
    const seen = new Set<string>();
    for (const [a, b] of CONFLICTING_TYPE_PAIRS) {
      expect(() => TypeNameSchema.parse(a)).not.toThrow();
      expect(() => TypeNameSchema.parse(b)).not.toThrow();
      const key = [a, b].sort().join("|");
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }
  });

  it("puts every creature in an evolution line — nothing is a dead end on its own", () => {
    const isEvolutionOfSomething = new Set(
      ALL.filter((s) => s.evolvesInto).map((s) => s.evolvesInto as string)
    );
    const orphans = ALL.filter((s) => !s.evolvesInto && !isEvolutionOfSomething.has(s.id)).map(
      (s) => `${s.name} (${s.id})`
    );
    expect(orphans).toEqual([]);
  });

  it("points every evolution at a species that exists, at a sane level", () => {
    for (const species of ALL) {
      if (!species.evolvesInto) continue;
      expect({ from: species.id, target: BY_ID.has(species.evolvesInto) }).toEqual({
        from: species.id,
        target: true,
      });
      expect(species.evolvesAtLevel).toBeGreaterThan(0);
      expect(species.evolvesAtLevel).toBeLessThanOrEqual(60);
    }
  });

  it("never loops an evolution line back on itself", () => {
    for (const species of ALL) {
      const seen = new Set<string>([species.id]);
      let cursor: Species | undefined = species;
      while (cursor?.evolvesInto) {
        const nextId: string = cursor.evolvesInto;
        expect({ line: species.id, revisits: seen.has(nextId) }).toEqual({
          line: species.id,
          revisits: false,
        });
        seen.add(nextId);
        cursor = BY_ID.get(nextId);
      }
    }
  });

  it("covers all 18 types with at least one creature", () => {
    const covered = new Set(ALL.flatMap((s) => s.types));
    const missing = TypeNameSchema.options.filter((t) => !covered.has(t));
    expect(missing).toEqual([]);
  });

  it("lets Normal creatures turn up in any biome", () => {
    const normals = wild.filter((c) => c.types.includes("Normal"));
    expect(normals.length).toBeGreaterThan(0);
    for (const creature of normals) {
      expect({ id: creature.id, biome: creature.biome }).toEqual({ id: creature.id, biome: "any" });
    }
  });

  it("only uses the 'any' biome for Normal creatures", () => {
    for (const creature of wild) {
      if (creature.biome !== "any") continue;
      expect({ id: creature.id, normal: creature.types.includes("Normal") }).toEqual({
        id: creature.id,
        normal: true,
      });
    }
  });

  it("gives every species a learnset of real moves", () => {
    const moveIds = new Set(
      (require("../moves.json") as { moves: Array<{ id: string }> }).moves.map((m) => m.id)
    );
    for (const species of ALL) {
      const entries = learnsets[species.id];
      expect({ id: species.id, hasLearnset: Array.isArray(entries) }).toEqual({
        id: species.id,
        hasLearnset: true,
      });
      for (const entry of entries) {
        expect({ id: species.id, move: entry.moveId, known: moveIds.has(entry.moveId) }).toEqual({
          id: species.id,
          move: entry.moveId,
          known: true,
        });
      }
    }
  });

  it("never hands a creature the out-of-PP last resort as a real move", () => {
    for (const creature of [...wild, ...variants]) {
      expect(creature.moveIds).not.toContain("scrap");
    }
    for (const [, entries] of Object.entries(learnsets)) {
      expect(entries.map((e) => e.moveId)).not.toContain("scrap");
    }
  });

  it("makes an evolved form stronger than what it evolved from", () => {
    const total = (s: { hp: number; atk: number; def: number; spatk: number; spdef: number; speed: number }) =>
      s.hp + s.atk + s.def + s.spatk + s.spdef + s.speed;
    const statsById = new Map(
      [...wild, ...variants, ...legendaries].map((c) => [c.id, c.baseStats])
    );
    for (const [id, stats] of statsById) {
      const species = BY_ID.get(id);
      if (!species?.evolvesInto) continue;
      const next = statsById.get(species.evolvesInto);
      if (!next) continue;
      expect({ id, stronger: total(next) > total(stats) }).toEqual({ id, stronger: true });
    }
  });
});
