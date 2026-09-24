import type { MoveData, TypeName } from "../data/schemas";
import { typeMatchups } from "../engine/typeChart";
import type { I18n } from "../i18n/core";
import { LAST_RESORT_MOVE_ID } from "./movesRepo";

/**
 * A move explained in plain words, built straight from its data.
 *
 * Nothing here is hand-written per move: the description is derived from power, accuracy,
 * PP, priority and stat changes, so it can never drift from what the move actually does in
 * battle, and it comes out in whichever language the player has chosen.
 */

export interface MoveSummary {
  name: string;
  type: TypeName;
  typeLabel: string;
  category: string;
  /** "—" for a status move. */
  power: string;
  accuracy: string;
  /** Sentences describing what happens when it is used, in order. */
  effects: string[];
  /** Which defending types take extra, reduced or no damage — damaging moves only. */
  matchups: string[];
}

/** Below this, the description warns that the move can miss. */
const LOW_ACCURACY = 85;
const SURE_HIT = 100;

export function describeMove(move: MoveData, i18n: I18n): MoveSummary {
  const { t, c } = i18n;
  const damaging = move.category !== "status";
  const effects: string[] = [];

  if (move.id === LAST_RESORT_MOVE_ID) effects.push(t("move.lastResort"));

  effects.push(
    damaging
      ? t("move.dealsDamage", {
          category: t(move.category === "physical" ? "move.dealsDamagePhysical" : "move.dealsDamageSpecial"),
          power: move.power,
        })
      : t("move.noDamage")
  );

  for (const change of move.statChanges ?? []) {
    const stages = Math.abs(change.stages);
    const key =
      change.target === "self"
        ? change.stages > 0
          ? "move.selfUp"
          : "move.selfDown"
        : change.stages > 0
          ? "move.foeUp"
          : "move.foeDown";
    const sentence = t(key, {
      stat: c.stat(change.stat),
      stages: stages === 1 ? t("move.stageOne") : t("move.stageMany", { count: stages }),
    });
    effects.push(change.chance < 100 ? t("move.chance", { chance: change.chance, effect: sentence }) : sentence);
  }

  if (damaging && !(move.statChanges ?? []).length && move.id !== LAST_RESORT_MOVE_ID) {
    effects.push(t("move.noSideEffects"));
  }

  if (move.accuracy < LOW_ACCURACY) effects.push(t("move.missRisk", { accuracy: move.accuracy }));
  else if (move.accuracy >= SURE_HIT && damaging) effects.push(t("move.sureHit"));

  if (move.basePriority > 0) effects.push(t("move.goesFirst"));
  if (move.basePriority < 0) effects.push(t("move.goesLast"));

  const matchups: string[] = [];
  if (damaging) {
    const m = typeMatchups(move.type);
    const list = (types: TypeName[]) => types.map((type) => c.type(type)).join(", ");
    if (m.strongAgainst.length) matchups.push(t("move.strongVs", { types: list(m.strongAgainst) }));
    if (m.weakAgainst.length) matchups.push(t("move.weakVs", { types: list(m.weakAgainst) }));
    if (m.noEffectAgainst.length) matchups.push(t("move.noneVs", { types: list(m.noEffectAgainst) }));
    if (!matchups.length) matchups.push(t("move.neutral"));
  }

  return {
    name: c.move(move.id),
    type: move.type,
    typeLabel: c.type(move.type),
    category: t(move.category === "physical" ? "move.physical" : move.category === "special" ? "move.special" : "move.status"),
    power: damaging ? String(move.power) : t("move.powerNone"),
    accuracy: `${move.accuracy}%`,
    effects,
    matchups,
  };
}
