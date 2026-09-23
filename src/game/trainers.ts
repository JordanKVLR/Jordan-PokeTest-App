import wildCreaturesData from "../data/wildCreatures.json";
import { WildCreaturesFileSchema, type TypeName, type WildCreature } from "../data/schemas";
import { generateZoneMap } from "./mapGenerator";
import { STAGES, getStage, type StageDef } from "./zoneProgression";
import { movesKnownAtLevel } from "./learnsetsRepo";
import { spawnsInZone } from "./spawning";
import { TYPE_BOASTS, TITLE_BOASTS, type BoastRef } from "../i18n/boasts";
import type { I18n } from "../i18n/core";

/**
 * Trainers are derived from the stage rather than hand-written, for the same reason the maps
 * are: twenty zones is too many to keep consistent by hand, and a trainer's job is to be a
 * tougher, more predictable fight than the grass — a known party at a known level, worth more
 * than a wild creature of the same level.
 *
 * Gym leaders are the exception that proves it: they get a bigger party, a level bump, and a
 * type specialty, so each block of five stages ends in a fight you can actually prepare for.
 */

const wildCreatures = WildCreaturesFileSchema.parse(wildCreaturesData).wildCreatures;

/** A trainer's reward multiplier against a wild creature of the same level. */
export const TRAINER_REWARD_MULTIPLIER = 2.5;
export const GYM_REWARD_MULTIPLIER = 4;

export interface TrainerCreature {
  speciesId: string;
  level: number;
}

export interface Trainer {
  id: string;
  name: string;
  title: string;
  zoneId: string;
  position: { row: number; col: number };
  party: TrainerCreature[];
  isGymLeader: boolean;
  /** Awarded on defeat, gym leaders only. */
  medalId?: string;
  medalName?: string;
  /** Things this trainer can say about themselves; one is picked at random as the match opens.
   * References rather than sentences, so the trainer speaks whichever language is chosen —
   * see src/i18n/boasts.ts and trainerLines() below. */
  boasts: BoastRef[];
  rewardMultiplier: number;
  /** The type this trainer fights under — their ace's primary type, or a gym's declared
   * specialty. Drives the elemental transition that plays into the battle. */
  signatureType: TypeName;
}



const FIRST_NAMES = [
  "Ċensu", "Wenzu", "Rożi", "Karmnu", "Ġużeppi", "Marija", "Toni", "Lolli",
  "Salvu", "Nina", "Pawlu", "Ġanni", "Mananni", "Peppi", "Katrin", "Indri",
];

const TITLES = [
  "Field Hand", "Quarry Cutter", "Net Mender", "Goat Herd", "Stone Mason",
  "Salt Raker", "Boat Wright", "Bell Ringer", "Fig Picker", "Lamp Lighter",
  "Cart Driver", "Wall Builder",
];

/** Same deterministic hash the map generator uses, so a zone's trainers never shuffle. */
function seedFrom(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Creatures that suit this zone: its own biomes first, so a trainer fits where they stand. */
function candidatesFor(stage: StageDef, typeFilter?: string): WildCreature[] {
  const inBiome = wildCreatures.filter((c) => spawnsInZone(c.biome, stage.biomes));
  if (!typeFilter) return inBiome.length > 0 ? inBiome : wildCreatures;
  const typed = wildCreatures.filter((c) => c.types.includes(typeFilter as WildCreature["types"][number]));
  return typed.length > 0 ? typed : inBiome;
}

function buildTrainer(
  stage: StageDef,
  index: number,
  position: { row: number; col: number }
): Trainer {
  const rng = makeRng(seedFrom(`${stage.id}:trainer:${index}`));
  const pool = candidatesFor(stage);
  const name = FIRST_NAMES[Math.floor(rng() * FIRST_NAMES.length)];
  const title = TITLES[Math.floor(rng() * TITLES.length)];

  // A touch above the local wild level: a trainer should be the harder fight on the route.
  const partySize = stage.stage < 4 ? 1 : stage.stage < 12 ? 2 : 3;
  const party: TrainerCreature[] = [];
  for (let i = 0; i < partySize; i++) {
    const species = pool[Math.floor(rng() * pool.length)];
    party.push({ speciesId: species.id, level: Math.max(2, stage.baseLevel + 1 + Math.floor(rng() * 2)) });
  }

  // Their ace is the last one out, so that is the type they are really fighting under.
  const aceSpecies = wildCreatures.find((c) => c.id === party[party.length - 1].speciesId);
  const signatureType = (aceSpecies?.types[0] ?? "Normal") as TypeName;

  return {
    id: `${stage.id}-trainer-${index}`,
    name,
    title,
    zoneId: stage.id,
    position,
    party,
    isGymLeader: false,
    boasts: boastsFor(signatureType, title, rng),
    rewardMultiplier: TRAINER_REWARD_MULTIPLIER,
    signatureType,
  };
}

/** Three things a trainer can say: two from their type, one from their trade. */
function boastsFor(type: TypeName, title: string, rng: () => number): BoastRef[] {
  const indices = TYPE_BOASTS.en[type].map((_, i) => i);
  const picked: BoastRef[] = [];
  for (let i = 0; i < 2 && indices.length; i++) {
    const index = indices.splice(Math.floor(rng() * indices.length), 1)[0];
    picked.push({ kind: "type", type, index });
  }
  if (TITLE_BOASTS.en[title]) picked.push({ kind: "title", title });
  return picked;
}

function buildGymLeader(stage: StageDef, position: { row: number; col: number }): Trainer {
  const gym = stage.gym!;
  const rng = makeRng(seedFrom(`${stage.id}:gym`));
  const pool = candidatesFor(stage, gym.specialty);

  // Gym parties are bigger and a clear step above the route, so the medal has to be earned.
  const party: TrainerCreature[] = [];
  const size = 3;
  for (let i = 0; i < size; i++) {
    const species = pool[Math.floor(rng() * pool.length)];
    const isAce = i === size - 1;
    party.push({
      speciesId: species.id,
      level: stage.baseLevel + (isAce ? 5 : 3),
    });
  }

  const signatureType = (gym.specialty ??
    wildCreatures.find((c) => c.id === party[party.length - 1].speciesId)?.types[0] ??
    "Normal") as TypeName;

  return {
    id: `${stage.id}-gym`,
    name: gym.leaderName,
    title: gym.leaderTitle,
    zoneId: stage.id,
    position,
    party,
    isGymLeader: true,
    medalId: gym.medalId,
    medalName: gym.medalName,
    boasts: [
      { kind: "type", type: signatureType, index: 0 },
      { kind: "type", type: signatureType, index: 1 },
      { kind: "gym", medalId: gym.medalId },
    ],
    signatureType,
    rewardMultiplier: GYM_REWARD_MULTIPLIER,
  };
}

const cache = new Map<string, Trainer[]>();

/** Every trainer in a zone, gym leader last. */
export function trainersForZone(zoneId: string): Trainer[] {
  const cached = cache.get(zoneId);
  if (cached) return cached;

  const stage = getStage(zoneId);
  if (!stage) return [];
  const generated = generateZoneMap(stage);
  const trainers = generated.trainerSpots.map((spot, i) => buildTrainer(stage, i, spot));
  if (stage.gym && generated.gymSpot) trainers.push(buildGymLeader(stage, generated.gymSpot));

  cache.set(zoneId, trainers);
  return trainers;
}

export function gymLeaderForZone(zoneId: string): Trainer | undefined {
  return trainersForZone(zoneId).find((t) => t.isGymLeader);
}

export function getTrainer(trainerId: string): Trainer | undefined {
  const zoneId = trainerId.replace(/-(trainer-\d+|gym)$/, "");
  return trainersForZone(zoneId).find((t) => t.id === trainerId);
}

/** The trainer standing on a tile, if any. */
export function trainerAt(zoneId: string, row: number, col: number): Trainer | undefined {
  return trainersForZone(zoneId).find((t) => t.position.row === row && t.position.col === col);
}

/** A trainer's creature as a battle-ready spec, with a level-appropriate moveset. */
export function trainerCreatureMoves(speciesId: string, level: number): string[] {
  const species = wildCreatures.find((c) => c.id === speciesId);
  return movesKnownAtLevel(speciesId, level, species?.moveIds ?? ["tackle"]);
}

/**
 * Every trainer in the game, across all twenty stages — the denominator for the win condition.
 *
 * Trainers are generated deterministically from the stage list, so this is a fixed set rather
 * than something that grows as the player explores: the total is knowable from a fresh save,
 * which is what lets the Home screen show "14 of 62" before you have met any of them.
 */
export function allTrainers(): Trainer[] {
  return STAGES.flatMap((stage) => trainersForZone(stage.id));
}

export interface CompletionProgress {
  trainersDefeated: number;
  trainersTotal: number;
  gymsDefeated: number;
  gymsTotal: number;
  /** True only once every trainer and every gym leader has been beaten. */
  complete: boolean;
}

/** How far through "beat everyone" the player is. */
export function completionProgress(defeatedTrainerIds: readonly string[]): CompletionProgress {
  const defeated = new Set(defeatedTrainerIds);
  const all = allTrainers();
  const gyms = all.filter((t) => t.isGymLeader);
  const trainersDefeated = all.filter((t) => defeated.has(t.id)).length;
  const gymsDefeated = gyms.filter((t) => defeated.has(t.id)).length;
  return {
    trainersDefeated,
    trainersTotal: all.length,
    gymsDefeated,
    gymsTotal: gyms.length,
    complete: trainersDefeated === all.length && gymsDefeated === gyms.length,
  };
}

/**
 * What a trainer says, in the player's language: how they open, a line about themselves, and
 * what they say on losing. Their title and medal are translated too; their name is not.
 */
export function trainerLines(trainer: Trainer, i18n: I18n, boast?: BoastRef) {
  const { t, c } = i18n;
  const title = trainer.isGymLeader && trainer.medalId ? c.gymTitle(trainer.medalId) : c.trainerTitle(trainer.title);
  const medal = trainer.medalId ? c.medal(trainer.medalId) : "";
  return {
    title,
    fullName: `${title} ${trainer.name}`,
    medal,
    intro: trainer.isGymLeader
      ? t("battle.gymStands", { name: trainer.name, title })
      : t("battle.trainerWants", { title, name: trainer.name }),
    boast: boast ? c.boast(boast) : null,
    defeat: trainer.isGymLeader
      ? t("battle.gymDefeat", { name: trainer.name, medal })
      : t("battle.defeat", { name: trainer.name }),
  };
}
