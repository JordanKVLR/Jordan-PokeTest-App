import wildCreaturesData from "../data/wildCreatures.json";
import { WildCreaturesFileSchema, type TypeName, type WildCreature } from "../data/schemas";
import { generateZoneMap } from "./mapGenerator";
import { STAGES, getStage, type StageDef } from "./zoneProgression";
import { movesKnownAtLevel } from "./learnsetsRepo";
import { spawnsInZone } from "./spawning";

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
  intro: string;
  /** Things this trainer says about themselves; one is picked at random as the match opens. */
  boasts: string[];
  defeatLine: string;
  rewardMultiplier: number;
  /** The type this trainer fights under — their ace's primary type, or a gym's declared
   * specialty. Drives the elemental transition that plays into the battle. */
  signatureType: TypeName;
}

/**
 * What a trainer says about themselves before the first throw.
 *
 * Keyed by the type they fight under, because that is the thing about them the player is about
 * to have to deal with. Three are offered per trainer and one is picked as the match opens, so
 * walking back into the same trainer does not replay the same sentence.
 */
const TYPE_BOASTS: Record<TypeName, string[]> = {
  Normal: [
    "Nothing fancy in my team. Nothing fancy has ever needed to be.",
    "I train what walks past my door. You would be surprised what that teaches you.",
    "No element, no trick. Just years of it.",
  ],
  Fire: [
    "I keep the lime kilns. You learn what heat does to a thing that won't bend.",
    "Everything I raise has been through a summer on the bare rock. Twice.",
    "Sun's been cooking this island for seven thousand years. I just work with it.",
  ],
  Water: [
    "Forty years off Marsaxlokk. The sea decides, and I've learned to agree with it early.",
    "My father fished this stretch and his before him. The creatures know the family.",
    "You can't out-wait water. People try.",
  ],
  Grass: [
    "Every wall on my land I built myself, and everything green behind them I raised.",
    "Terraces don't forgive a lazy season. Neither do I.",
    "Give me poor soil and a bad year. That's when the good ones show.",
  ],
  Rock: [
    "Third generation in the quarry. I know what's inside a stone before I cut it.",
    "Globigerina under my fingernails since I was nine. It doesn't wash out.",
    "This island is one big block. I've just been taking pieces off it.",
  ],
  Ground: [
    "I've dug more of this island than I've walked on.",
    "Red soil, three feet down, then bedrock. Everything I train comes up through that.",
    "You want to know a place, go under it.",
  ],
  Steel: [
    "The Order left their armour behind. Someone had to keep it standing.",
    "I mend what the sea eats. It's steady work.",
    "Nothing I bring out today is going to break first.",
  ],
  Electric: [
    "I ran the telegraph line when it still meant something. My team kept pace with it.",
    "Storms come off the north in January. I go out in them.",
    "Fast is a decision, not a gift.",
  ],
  Ice: [
    "The tramuntana cracks the limestone. I raise what rides in on it.",
    "Everyone says there's no cold here. Everyone is wrong about January.",
    "Frost gets into stone and splits it from the inside. That's my whole approach.",
  ],
  Flying: [
    "I kept falcons for the tribute. One a year, to an emperor. Standards stayed.",
    "Watch the ridge at dawn and you'll see what I've been training with.",
    "Everything I raise looks down on the rest of the island. Including me.",
  ],
  Fighting: [
    "I carried stone up the Ġgantija hill on a bet. Won it.",
    "No technique. Just more of it than you have.",
    "I've been knocked down on this road before. Ask anyone where I am now.",
  ],
  Psychic: [
    "I sat in the Hypogeum overnight once. Something answered.",
    "The temples are aligned to the solstice. I've been aligned to them a while.",
    "I don't guess what you'll do. I just wait for you to do it.",
  ],
  Ghost: [
    "The catacombs under this town run further than the town does. I know most of them.",
    "You'll hear my team before you see them. That's usually enough.",
    "Nobody buried down there ever really left.",
  ],
  Dark: [
    "I move at night. The island's a different place after ten.",
    "Corsairs worked this coast for three hundred years. Somebody kept their habits.",
    "You won't get a clean look at what I'm sending out.",
  ],
  Fairy: [
    "Every village festa on this island, I've been to. You pick things up.",
    "Luck isn't luck. It's knowing which day to fight on.",
    "The old women bless the boats for a reason. It works.",
  ],
  Bug: [
    "Twenty hives in the valley. The honey pays; the bees teach.",
    "Small and organised beats big and slow. Every time.",
    "You'll be surrounded before you've picked a target.",
  ],
  Poison: [
    "Murex shells, boiled down for the dye. The smell never leaves you, and neither does the lesson.",
    "The viper on this island has a bad name and a worse bite.",
    "I don't need to win the first turn. I just need you to still be here on the fourth.",
  ],
  Dragon: [
    "I've seen the swell that has a shape to it. Once. That was enough.",
    "Sailors name the thing they won't describe. I raised one.",
    "There's older things than the temples out past the harbour mouth.",
  ],
};

const TITLE_BOASTS: Record<string, string> = {
  "Field Hand": "I've worked someone else's land my whole life. This team is the one thing that's mine.",
  "Quarry Cutter": "Eleven hours a day cutting blocks. This is my idea of a rest.",
  "Net Mender": "I can fix a net blind. Sitting still that long, you think about tactics.",
  "Goat Herd": "Goats go where they like. Training them taught me patience for anything.",
  "Stone Mason": "Every course has to sit true or the whole wall goes. Same with a party.",
  "Salt Raker": "I scrape the pans at Salina. Slow work, and I never miss a square.",
  "Boat Wright": "I build luzzus. Nothing leaves my yard half-finished, including this team.",
  "Bell Ringer": "Three hundred steps up the campanile, six times a day. Ask me about stamina.",
  "Fig Picker": "I know exactly when a thing is ready. It's the only skill I have and it's enough.",
  "Lamp Lighter": "I've walked every street in this town after dark. Nothing out here surprises me.",
  "Cart Driver": "Been up and down this road since before it was paved. I know who's worth stopping for.",
  "Wall Builder": "Rubble walls, no mortar, standing four hundred years. That's my record.",
};

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
    intro: `${title} ${name} wants a battle!`,
    boasts: boastsFor(signatureType, title, rng),
    defeatLine: `${name}: "Mela, you've been training. Go on through."`,
    rewardMultiplier: TRAINER_REWARD_MULTIPLIER,
    signatureType,
  };
}

/** Three things a trainer can say: two from their type, one from their trade. */
function boastsFor(type: TypeName, title: string, rng: () => number): string[] {
  const fromType = [...TYPE_BOASTS[type]];
  const picked: string[] = [];
  for (let i = 0; i < 2 && fromType.length; i++) {
    picked.push(fromType.splice(Math.floor(rng() * fromType.length), 1)[0]);
  }
  const trade = TITLE_BOASTS[title];
  if (trade) picked.push(trade);
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
    intro: `${gym.leaderName}, ${gym.leaderTitle}, stands in the way.`,
    boasts: [
      ...TYPE_BOASTS[signatureType].slice(0, 2),
      `I hold the ${gym.medalName}. Nobody has taken it off me on a good day.`,
    ],
    signatureType,
    defeatLine: `${gym.leaderName}: "Well fought. The ${gym.medalName} is yours — the road onward is open."`,
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
