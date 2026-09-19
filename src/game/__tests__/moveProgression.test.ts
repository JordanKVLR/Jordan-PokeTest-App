import { addExperience, applyLevelUp, fullPpFor, isOutOfPp, remainingPp, type PartyMember } from "../party";
import { getMove, LAST_RESORT_MOVE_ID } from "../movesRepo";
import { learnsetFor, movesLearnedBetween, movesKnownAtLevel } from "../learnsetsRepo";
import { xpToNextLevel } from "../progression";
import wildCreaturesData from "../../data/wildCreatures.json";

function member(overrides: Partial<PartyMember> = {}): PartyMember {
  return {
    uid: "u",
    speciesId: "calfleaf",
    displayName: "Calfleaf",
    types: ["Grass"],
    level: 8,
    xp: 0,
    baseStats: { hp: 55, atk: 68, def: 59, spatk: 40, spdef: 56, speed: 37 },
    currentHp: 30,
    moveIds: ["vine_lash", "tackle"],
    movePp: fullPpFor(["vine_lash", "tackle"]),
    sourceCategory: "starter",
    ...overrides,
  };
}

/** Enough XP to climb from `from` to `to` in one grant. */
function xpToReach(from: number, to: number): number {
  let total = 0;
  for (let lv = from; lv < to; lv++) total += xpToNextLevel(lv);
  return total;
}

describe("PP bookkeeping", () => {
  it("reports a move's full PP when the save has no entry for it", () => {
    const m = member({ movePp: undefined });
    expect(remainingPp(m, "tackle")).toBe(getMove("tackle").pp);
  });

  it("knows when everything is spent", () => {
    expect(isOutOfPp(member())).toBe(false);
    expect(isOutOfPp(member({ movePp: { vine_lash: 0, tackle: 0 } }))).toBe(true);
    expect(isOutOfPp(member({ movePp: { vine_lash: 0, tackle: 1 } }))).toBe(false);
  });
});

describe("move balance", () => {
  it("rations heavy hitters and makes them less accurate than a basic attack", () => {
    const basic = getMove("tackle");
    const heavy = getMove("siege_volley");

    expect(heavy.power).toBeGreaterThan(basic.power);
    expect(heavy.accuracy).toBeLessThan(basic.accuracy);
    expect(heavy.pp).toBeLessThan(basic.pp);
  });

  it("gives the last resort unlimited use but poor power", () => {
    const scrap = getMove(LAST_RESORT_MOVE_ID);
    expect(scrap.power).toBeLessThan(getMove("tackle").power);
    expect(scrap.pp).toBeGreaterThan(100);
  });

  it("never gives a status move damage, or a damaging move zero power", () => {
    for (const creature of wildCreaturesData.wildCreatures) {
      for (const moveId of creature.moveIds) {
        const move = getMove(moveId);
        if (move.category === "status") expect(move.power).toBe(0);
        else expect(move.power).toBeGreaterThan(0);
      }
    }
  });
});

describe("learnsets", () => {
  it("gives every species something to learn, in level order", () => {
    for (const creature of wildCreaturesData.wildCreatures) {
      const set = learnsetFor(creature.id);
      expect(set.length).toBeGreaterThan(0);
      const levels = set.map((e) => e.level);
      expect([...levels].sort((a, b) => a - b)).toEqual(levels);
      for (const entry of set) expect(() => getMove(entry.moveId)).not.toThrow();
    }
  });

  it("reports only the moves unlocked inside the level range", () => {
    const all = learnsetFor("calfleaf");
    const first = all[0];
    expect(movesLearnedBetween("calfleaf", first.level, first.level)).toEqual([]);
    expect(movesLearnedBetween("calfleaf", first.level - 1, first.level)).toEqual([first.moveId]);
  });

  it("builds a level-appropriate moveset for a creature created partway up its curve", () => {
    const known = movesKnownAtLevel("kavallier", 45, ["metal_claw"]);
    expect(known.length).toBeGreaterThan(1);
    expect(known.length).toBeLessThanOrEqual(4);
  });
});

describe("learning moves on level up", () => {
  it("fills a free slot automatically and reports what was learned", () => {
    const first = learnsetFor("calfleaf")[0];
    const before = member({ level: first.level - 1, moveIds: ["vine_lash", "tackle"] });

    const result = addExperience(before, xpToReach(before.level, first.level));

    expect(result.newLevel).toBe(first.level);
    expect(result.moveLearning.learned).toContain(first.moveId);
    expect(result.member.moveIds).toContain(first.moveId);
    expect(result.moveLearning.pending).toEqual([]);
  });

  it("gives a newly learned move full PP", () => {
    const first = learnsetFor("calfleaf")[0];
    const result = addExperience(member({ level: first.level - 1 }), xpToReach(first.level - 1, first.level));
    expect(result.member.movePp?.[first.moveId]).toBe(getMove(first.moveId).pp);
  });

  it("holds a move back as pending when all four slots are full", () => {
    const first = learnsetFor("calfleaf")[0];
    const full = member({
      level: first.level - 1,
      moveIds: ["vine_lash", "tackle", "rock_throw", "ember"],
      movePp: fullPpFor(["vine_lash", "tackle", "rock_throw", "ember"]),
    });

    const result = addExperience(full, xpToReach(full.level, first.level));

    expect(result.member.moveIds).toHaveLength(4);
    expect(result.moveLearning.learned).toEqual([]);
    expect(result.moveLearning.pending).toContain(first.moveId);
  });

  it("learns everything passed through on a multi-level jump", () => {
    const set = learnsetFor("mosstaur");
    const target = set[1].level;
    const low = member({ speciesId: "mosstaur", displayName: "Moss-taur", level: 1, moveIds: ["tackle"] });

    const result = addExperience(low, xpToReach(1, target));

    const expected = set.filter((e) => e.level <= target).map((e) => e.moveId);
    for (const moveId of expected.slice(0, 3)) {
      expect([...result.member.moveIds, ...result.moveLearning.pending]).toContain(moveId);
    }
  });

  it("also learns from a direct level-up (the Kinnie item)", () => {
    const first = learnsetFor("calfleaf")[0];
    const { member: leveled, moveLearning } = applyLevelUp(member({ level: first.level - 1 }));
    expect(leveled.level).toBe(first.level);
    expect(moveLearning.learned).toContain(first.moveId);
  });
});
