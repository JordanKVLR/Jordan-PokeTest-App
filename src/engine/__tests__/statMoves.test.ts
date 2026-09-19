import { resolveAction } from "../battleManager";
import { makeCreature, makeMove } from "./testHelpers";
import type { BattleContext } from "../types";

function makeContext(): BattleContext {
  return {
    playerActive: makeCreature({ id: "p" }),
    enemyActive: makeCreature({ id: "e" }),
    turnCount: 1,
    fieldEffects: {},
  };
}

/** Deterministic rolls, consumed in order, so chance-based effects are testable. */
function rolls(values: number[]): () => number {
  let i = 0;
  return () => values[Math.min(i++, values.length - 1)];
}

describe("status moves", () => {
  it("deal no damage and raise the user's own stat", () => {
    const ctx = makeContext();
    const move = makeMove({
      id: "war_cry",
      category: "status",
      power: 0,
      statChanges: [{ target: "self", stat: "atk", stages: 2, chance: 100 }],
    });

    const outcome = resolveAction(ctx, { kind: "move", actorId: "p", moveId: move.id }, () => move, rolls([0.5]));

    expect(outcome.damage).toBe(0);
    expect(ctx.enemyActive.currentHp).toBe(100);
    expect(ctx.playerActive.statStages.atk).toBe(2);
    expect(outcome.statChanges).toEqual([
      { target: "self", stat: "atk", stages: 2, statName: "Attack" },
    ]);
  });

  it("lower the opponent's stat", () => {
    const ctx = makeContext();
    const move = makeMove({
      category: "status",
      power: 0,
      statChanges: [{ target: "opponent", stat: "speed", stages: -2, chance: 100 }],
    });

    resolveAction(ctx, { kind: "move", actorId: "p", moveId: move.id }, () => move, rolls([0.5]));

    expect(ctx.enemyActive.statStages.speed).toBe(-2);
    expect(ctx.playerActive.statStages.speed).toBe(0);
  });

  it("clamp at the ends of the -6..+6 stage table and report 0 stages moved", () => {
    const ctx = makeContext();
    ctx.playerActive.statStages.def = 5;
    const move = makeMove({
      category: "status",
      power: 0,
      statChanges: [{ target: "self", stat: "def", stages: 2, chance: 100 }],
    });

    const first = resolveAction(ctx, { kind: "move", actorId: "p", moveId: move.id }, () => move, rolls([0.5]));
    expect(ctx.playerActive.statStages.def).toBe(6);
    expect(first.statChanges?.[0].stages).toBe(1); // only had room for one

    const second = resolveAction(ctx, { kind: "move", actorId: "p", moveId: move.id }, () => move, rolls([0.5]));
    expect(ctx.playerActive.statStages.def).toBe(6);
    expect(second.statChanges?.[0].stages).toBe(0); // pinned
  });
});

describe("secondary stat effects on damaging moves", () => {
  const move = makeMove({
    power: 80,
    accuracy: 100,
    statChanges: [{ target: "self", stat: "spatk", stages: -1, chance: 100 }],
  });

  it("apply after damage is dealt", () => {
    const ctx = makeContext();
    const outcome = resolveAction(
      ctx,
      { kind: "move", actorId: "p", moveId: move.id },
      () => move,
      rolls([0.9, 0.5, 0.5])
    );

    expect(outcome.damage).toBeGreaterThan(0);
    expect(ctx.playerActive.statStages.spatk).toBe(-1);
  });

  it("are skipped when the chance roll fails", () => {
    const chancy = makeMove({
      power: 80,
      accuracy: 100,
      statChanges: [{ target: "opponent", stat: "def", stages: -1, chance: 30 }],
    });
    const ctx = makeContext();
    // crit roll, damage roll, then the 30% effect roll — 0.99*100 = 99 >= 30, so it misses.
    resolveAction(ctx, { kind: "move", actorId: "p", moveId: chancy.id }, () => chancy, rolls([0.9, 0.5, 0.99]));
    expect(ctx.enemyActive.statStages.def).toBe(0);
  });

  it("do not debuff a target that just fainted", () => {
    const ctx = makeContext();
    ctx.enemyActive.currentHp = 1;
    const finisher = makeMove({
      power: 120,
      accuracy: 100,
      statChanges: [{ target: "opponent", stat: "atk", stages: -2, chance: 100 }],
    });

    resolveAction(ctx, { kind: "move", actorId: "p", moveId: finisher.id }, () => finisher, rolls([0.9, 0.5, 0.5]));

    expect(ctx.enemyActive.currentHp).toBe(0);
    expect(ctx.enemyActive.statStages.atk).toBe(0);
  });
});

describe("stat stages affect the damage they should", () => {
  it("a raised Attack stage increases physical damage", () => {
    const move = makeMove({ power: 80, accuracy: 100 });
    const baseline = makeContext();
    resolveAction(baseline, { kind: "move", actorId: "p", moveId: move.id }, () => move, rolls([0.9, 0.5]));
    const baselineDamage = 100 - baseline.enemyActive.currentHp;

    const boosted = makeContext();
    boosted.playerActive.statStages.atk = 2;
    resolveAction(boosted, { kind: "move", actorId: "p", moveId: move.id }, () => move, rolls([0.9, 0.5]));
    const boostedDamage = 100 - boosted.enemyActive.currentHp;

    expect(boostedDamage).toBeGreaterThan(baselineDamage);
  });
});
