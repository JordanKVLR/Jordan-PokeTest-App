import typeChartData from "../type_chart.json";
import { TypeNameSchema } from "../schemas";

const TYPES = TypeNameSchema.options;
const matrix = typeChartData.matrix as Record<string, Record<string, number>>;

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

  it("is the official chart exactly, plus Ice resisting Normal", () => {
    // The current mainline chart (Gen 6 onward), non-neutral cells only.
    const OFFICIAL: Record<string, Record<string, number>> = {"Normal": {"Rock": 0.5, "Ghost": 0, "Steel": 0.5}, "Fire": {"Fire": 0.5, "Water": 0.5, "Grass": 2, "Ice": 2, "Bug": 2, "Rock": 0.5, "Dragon": 0.5, "Steel": 2}, "Water": {"Fire": 2, "Water": 0.5, "Grass": 0.5, "Ground": 2, "Rock": 2, "Dragon": 0.5}, "Electric": {"Water": 2, "Electric": 0.5, "Grass": 0.5, "Ground": 0, "Flying": 2, "Dragon": 0.5}, "Grass": {"Fire": 0.5, "Water": 2, "Grass": 0.5, "Poison": 0.5, "Ground": 2, "Flying": 0.5, "Bug": 0.5, "Rock": 2, "Dragon": 0.5, "Steel": 0.5}, "Ice": {"Fire": 0.5, "Water": 0.5, "Grass": 2, "Ice": 0.5, "Ground": 2, "Flying": 2, "Dragon": 2, "Steel": 0.5}, "Fighting": {"Normal": 2, "Ice": 2, "Poison": 0.5, "Flying": 0.5, "Psychic": 0.5, "Bug": 0.5, "Rock": 2, "Ghost": 0, "Dark": 2, "Steel": 2, "Fairy": 0.5}, "Poison": {"Grass": 2, "Poison": 0.5, "Ground": 0.5, "Rock": 0.5, "Ghost": 0.5, "Steel": 0, "Fairy": 2}, "Ground": {"Fire": 2, "Electric": 2, "Grass": 0.5, "Poison": 2, "Flying": 0, "Bug": 0.5, "Rock": 2, "Steel": 2}, "Flying": {"Electric": 0.5, "Grass": 2, "Fighting": 2, "Bug": 2, "Rock": 0.5, "Steel": 0.5}, "Psychic": {"Fighting": 2, "Poison": 2, "Psychic": 0.5, "Dark": 0, "Steel": 0.5}, "Bug": {"Fire": 0.5, "Grass": 2, "Fighting": 0.5, "Poison": 0.5, "Flying": 0.5, "Psychic": 2, "Ghost": 0.5, "Dark": 2, "Steel": 0.5, "Fairy": 0.5}, "Rock": {"Fire": 2, "Ice": 2, "Fighting": 0.5, "Ground": 0.5, "Flying": 2, "Bug": 2, "Steel": 0.5}, "Ghost": {"Normal": 0, "Psychic": 2, "Ghost": 2, "Dark": 0.5}, "Dragon": {"Dragon": 2, "Steel": 0.5, "Fairy": 0}, "Dark": {"Fighting": 0.5, "Psychic": 2, "Ghost": 2, "Dark": 0.5, "Fairy": 0.5}, "Steel": {"Fire": 0.5, "Water": 0.5, "Electric": 0.5, "Ice": 2, "Rock": 2, "Steel": 0.5, "Fairy": 2}, "Fairy": {"Fire": 0.5, "Fighting": 2, "Poison": 0.5, "Dragon": 2, "Dark": 2, "Steel": 0.5}};
    // The one house rule, asked for by name.
    const HOUSE_RULES: Record<string, Record<string, number>> = { Normal: { Ice: 0.5 } };
    const differences: string[] = [];
    for (const attacker of TYPES) {
      for (const defender of TYPES) {
        const expected = HOUSE_RULES[attacker]?.[defender] ?? OFFICIAL[attacker]?.[defender] ?? 1;
        if (matrix[attacker][defender] !== expected) {
          differences.push(`${attacker} -> ${defender}: ${matrix[attacker][defender]}, expected ${expected}`);
        }
      }
    }
    expect(differences).toEqual([]);
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
});
