import { describeMove } from "../moveInfo";
import { getMove } from "../movesRepo";
import { i18nFor } from "../../i18n/core";
import movesData from "../../data/moves.json";

const en = i18nFor("en");
const mt = i18nFor("mt");

describe("move inspection", () => {
  it("explains a plain attack: damage, no side effects, reliable", () => {
    const tackle = describeMove(getMove("tackle"), en);
    expect(tackle.power).toBe("40");
    expect(tackle.effects).toContain("Deals physical damage with a power of 40.");
    expect(tackle.effects).toContain("No side effects.");
    expect(tackle.effects).toContain("Almost never misses.");
  });

  it("spells out every stat change, including chance-based ones", () => {
    for (const move of movesData.moves) {
      const summary = describeMove(getMove(move.id), en);
      const changes = move.statChanges ?? [];
      // One sentence per stat change, beyond the damage line.
      const statLines = summary.effects.filter((e) => /Raises|Lowers/.test(e));
      expect({ move: move.id, lines: statLines.length }).toEqual({ move: move.id, lines: changes.length });
      for (const change of changes.filter((ch) => (ch.chance ?? 100) < 100)) {
        expect(summary.effects.some((e) => e.startsWith(`${change.chance}% chance:`))).toBe(true);
      }
    }
  });

  it("warns about moves that can miss", () => {
    const risky = movesData.moves.find((m) => m.accuracy < 85)!;
    expect(describeMove(getMove(risky.id), en).effects.join(" ")).toContain(`Only ${risky.accuracy}% accurate`);
  });

  it("describes a status move as dealing no damage and lists no matchups", () => {
    const status = movesData.moves.find((m) => m.category === "status")!;
    const summary = describeMove(getMove(status.id), en);
    expect(summary.power).toBe("—");
    expect(summary.effects[0]).toContain("no damage");
    expect(summary.matchups).toEqual([]);
  });

  it("lists what a damaging move is strong and weak against", () => {
    const ember = describeMove(getMove("ember"), en);
    expect(ember.matchups.join(" ")).toContain("Super effective against");
    expect(ember.matchups.join(" ")).toContain("Grass");
  });

  it("reads the same move in Maltese", () => {
    const ember = describeMove(getMove("ember"), mt);
    expect(ember.name).toBe("Ġamra");
    expect(ember.typeLabel).toBe("Nar");
    expect(ember.matchups.join(" ")).toContain("Ħaxix");
    expect(ember.effects.join(" ")).not.toMatch(/Deals|damage/);
  });

  it("describes every move in the game without leaving a placeholder behind", () => {
    for (const lang of [en, mt]) {
      for (const move of movesData.moves) {
        const text = JSON.stringify(describeMove(getMove(move.id), lang));
        expect({ move: move.id, leftover: /\{\w+\}/.test(text) }).toEqual({ move: move.id, leftover: false });
      }
    }
  });
});
