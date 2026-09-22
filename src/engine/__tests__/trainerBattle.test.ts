import { BattleStateMachine } from "../battleManager";
import { makeCreature, makeMove } from "./testHelpers";
import type { BattleContext } from "../types";

function contextWith(enemyHp: number): BattleContext {
  return {
    playerActive: makeCreature({ id: "p", currentHp: 100 }),
    enemyActive: makeCreature({ id: "e1", currentHp: enemyHp }),
    turnCount: 0,
    fieldEffects: {},
  };
}

const bigHit = makeMove({ id: "big", power: 200, accuracy: 100 });
const noop = makeMove({ id: "noop", category: "status", power: 0, accuracy: 100 });

/** Drives one full turn where the player's hit knocks the current foe out. */
function knockOutFoe(fsm: BattleStateMachine, ctx: BattleContext) {
  fsm.submitActions(
    { kind: "move", actorId: "p", moveId: bigHit.id },
    { kind: "move", actorId: ctx.enemyActive.id, moveId: noop.id },
    () => {}
  );
}

describe("trainer battles: sending out the next creature", () => {
  it("ends the battle when a foe faints, then resumes once the next one is swapped in", () => {
    const ctx = contextWith(10);
    const fsm = new BattleStateMachine(ctx, (id) => (id === bigHit.id ? bigHit : noop), () => 0.5);
    fsm.start();

    knockOutFoe(fsm, ctx);
    expect(ctx.enemyActive.currentHp).toBe(0);
    expect(fsm.getState()).toBe("BATTLE_END");

    // The screen swaps the trainer's next creature into the context, then resumes.
    ctx.enemyActive = makeCreature({ id: "e2", currentHp: 100 });
    fsm.restartAfterEnemySwap();

    expect(fsm.getState()).toBe("ACTION_SELECT");
  });

  it("keeps accepting turns against the new foe after resuming", () => {
    const ctx = contextWith(10);
    const fsm = new BattleStateMachine(ctx, (id) => (id === bigHit.id ? bigHit : noop), () => 0.5);
    fsm.start();
    knockOutFoe(fsm, ctx);

    // The second foe takes damage from the resumed turn just as the first did.
    ctx.enemyActive = makeCreature({ id: "e2", currentHp: 100 });
    fsm.restartAfterEnemySwap();
    knockOutFoe(fsm, ctx);
    expect(ctx.enemyActive.currentHp).toBeLessThan(100);

    // Finishing it off ends the battle for real — the machine is still mid-battle here, so
    // no resume is needed, just another turn.
    ctx.enemyActive.currentHp = 5;
    knockOutFoe(fsm, ctx);
    expect(ctx.enemyActive.currentHp).toBe(0);
    expect(fsm.getState()).toBe("BATTLE_END");
  });

  it("refuses to resume a battle the player actually lost", () => {
    const ctx = contextWith(100);
    ctx.playerActive.currentHp = 1;
    const fsm = new BattleStateMachine(ctx, () => bigHit, () => 0.5);
    fsm.start();

    // The foe's hit knocks the player out, which is a real loss, not a foe swap.
    fsm.submitActions(
      { kind: "move", actorId: "p", moveId: bigHit.id },
      { kind: "move", actorId: "e1", moveId: bigHit.id },
      () => {}
    );

    if (ctx.playerActive.currentHp <= 0) {
      expect(() => fsm.restartAfterEnemySwap()).toThrow(/lost/);
    } else {
      // The player's hit landed first and won; resuming needs a live foe swapped in first.
      expect(() => fsm.restartAfterEnemySwap()).toThrow(/swapped in/);
    }
  });

  it("refuses to resume from a state that isn't the end of a battle", () => {
    const ctx = contextWith(100);
    const fsm = new BattleStateMachine(ctx, () => noop, () => 0.5);
    fsm.start();
    expect(() => fsm.restartAfterEnemySwap()).toThrow(/Cannot resume/);
  });
});
