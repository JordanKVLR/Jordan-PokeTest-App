import type { TypeName } from "../data/schemas";

export type StatusCondition =
  | "none"
  | "sleep"
  | "freeze"
  | "paralysis"
  | "burn"
  | "poison"
  | "confusion";

export interface Stats {
  hp: number;
  atk: number;
  def: number;
  spatk: number;
  spdef: number;
  speed: number;
}

export type StatKey = keyof Stats;

export interface StatStages {
  atk: number;
  def: number;
  spatk: number;
  spdef: number;
  speed: number;
  evasion: number;
  accuracy: number;
}

export const NEUTRAL_STAT_STAGES: StatStages = {
  atk: 0,
  def: 0,
  spatk: 0,
  spdef: 0,
  speed: 0,
  evasion: 0,
  accuracy: 0,
};

export interface StatusEffect {
  id: string;
  /** Turns remaining, or null for an effect with no fixed duration. */
  turnsRemaining: number | null;
  onApply?: (target: Creature) => void;
  onTurnTick?: (target: Creature) => void;
  onExpire?: (target: Creature) => void;
}

export interface StatChange {
  target: "self" | "opponent";
  stat: keyof StatStages;
  stages: number;
  /** Percentage chance of landing; 100 for a status move's primary effect. */
  chance: number;
}

export interface Move {
  id: string;
  name: string;
  type: TypeName;
  /** "status" deals no damage — it exists for its statChanges. */
  category: "physical" | "special" | "status";
  power: number;
  accuracy: number;
  /** Maximum uses. Current remaining PP lives on the party member, not the move. */
  pp: number;
  basePriority: number;
  statusEffect?: StatusCondition;
  statChanges?: StatChange[];
}

export interface Creature {
  id: string;
  speciesId: string;
  level: number;
  types: TypeName[];
  stats: Stats;
  statStages: StatStages;
  currentHp: number;
  status: StatusCondition;
  flinched: boolean;
  activeEffects: StatusEffect[];
}

export type BattleAction =
  | { kind: "move"; actorId: string; moveId: string }
  | { kind: "switch"; actorId: string; targetPartyIndex: number }
  | { kind: "item"; actorId: string; itemId: string }
  | { kind: "invoke_crux"; actorId: string }
  | { kind: "flee"; actorId: string };

export interface BattleContext {
  playerActive: Creature;
  enemyActive: Creature;
  turnCount: number;
  fieldEffects: Record<string, number>;
}
