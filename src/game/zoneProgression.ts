import type { BiomeType } from "./mapData";

/**
 * The island chain as a 20-stage run. Stages get harder in a straight line, and every fifth
 * one is a gym: its leader guards a medal, and the medal is what opens the road onward. So
 * the run reads as four blocks of five — four legs of a journey, each ending at a landmark.
 */
export interface GymDef {
  medalId: string;
  medalName: string;
  leaderName: string;
  leaderTitle: string;
  /** The leader's party is built around this type, telegraphing how to prepare. */
  specialty: string;
}

export interface StageDef {
  /** 1-based position in the run. */
  stage: number;
  id: string;
  name: string;
  /** Each zone mixes two terrains, which decide its wild pools. */
  biomes: [BiomeType, BiomeType];
  baseLevel: number;
  levelSpread: number;
  legendaryMinLevel: number;
  gym?: GymDef;
  /** Medal required to walk in here at all. Set on the stage right after each gym. */
  requiresMedal?: string;
}

const RAW: Array<{
  id: string;
  name: string;
  biomes: [BiomeType, BiomeType];
  gym?: GymDef;
  requiresMedal?: string;
}> = [
  // Terrain deliberately never repeats between neighbouring stages — see the rule enforced in
  // the tests. Walking the run should feel like crossing an island, not grinding one field.
  { id: "melita_woods", name: "Melita Woods", biomes: ["grass", "rock"] },
  { id: "salina_saltpans", name: "Salina Saltpans", biomes: ["water", "sand"] },
  { id: "dingli_cliffs", name: "Dingli Cliffs", biomes: ["rock", "water"] },
  { id: "ramla_dunes", name: "Ramla Dunes", biomes: ["sand", "grass"] },
  {
    id: "mdina_bastions",
    name: "Mdina Bastions",
    biomes: ["rock", "grass"],
    gym: {
      medalId: "silent_city",
      medalName: "Silent City Medal",
      leaderName: "Dun Ġorġ",
      leaderTitle: "Keeper of the Silent City",
      specialty: "Rock",
    },
  },

  { id: "marsaxlokk_bay", name: "Marsaxlokk Bay", biomes: ["water", "sand"], requiresMedal: "silent_city" },
  { id: "wied_ghasel", name: "Wied il-Għasel", biomes: ["grass", "water"] },
  { id: "sirocco_flats", name: "Sirocco Flats", biomes: ["sand", "rock"] },
  { id: "simar_wetlands", name: "Is-Simar Wetlands", biomes: ["water", "grass"] },
  {
    id: "fort_st_angelo",
    name: "Fort St Angelo",
    biomes: ["rock", "water"],
    gym: {
      medalId: "great_siege",
      medalName: "Great Siege Medal",
      leaderName: "Castellan Brimlu",
      leaderTitle: "Warden of the Harbour Forts",
      specialty: "Steel",
    },
  },

  { id: "mtahleb_terraces", name: "Mtaħleb Terraces", biomes: ["grass", "sand"], requiresMedal: "great_siege" },
  { id: "azure_caverns", name: "Azure Caverns", biomes: ["rock", "water"] },
  { id: "golden_bay", name: "Golden Bay Sands", biomes: ["sand", "grass"] },
  { id: "comino_lagoon", name: "Comino Blue Lagoon", biomes: ["water", "rock"] },
  {
    id: "hagar_qim",
    name: "Ħaġar Qim Sanctum",
    biomes: ["rock", "grass"],
    gym: {
      medalId: "solstice",
      medalName: "Solstice Medal",
      leaderName: "Oracle Sansuna",
      leaderTitle: "Voice of the Temple Builders",
      specialty: "Psychic",
    },
  },

  { id: "delimara_point", name: "Delimara Point", biomes: ["sand", "water"], requiresMedal: "solstice" },
  { id: "ggantija_terrace", name: "Ġgantija Terrace", biomes: ["grass", "rock"] },
  { id: "ghar_dalam", name: "Għar Dalam Deep", biomes: ["sand", "rock"] },
  { id: "wied_babu", name: "Wied Babu Gorge", biomes: ["grass", "water"] },
  {
    id: "grand_harbour",
    name: "Valletta Grand Harbour",
    biomes: ["water", "rock"],
    gym: {
      medalId: "grand_harbour",
      medalName: "Grand Harbour Medal",
      leaderName: "Admiral Xprunara",
      leaderTitle: "Master of the Grand Harbour",
      specialty: "Water",
    },
  },
];

/** Wild levels climb steadily across the run: roughly 4 at the start, high 50s at the end. */
function levelForStage(stage: number): number {
  return Math.round(2 + stage * 2.9);
}

export const STAGES: StageDef[] = RAW.map((raw, i) => {
  const stage = i + 1;
  return {
    stage,
    id: raw.id,
    name: raw.name,
    biomes: raw.biomes,
    baseLevel: levelForStage(stage),
    levelSpread: 2 + Math.floor(stage / 7),
    legendaryMinLevel: levelForStage(stage) + 18,
    gym: raw.gym,
    requiresMedal: raw.requiresMedal,
  };
});

export const FIRST_STAGE_ID = STAGES[0].id;

const BY_ID = new Map(STAGES.map((s) => [s.id, s]));

export function getStage(zoneId: string): StageDef | undefined {
  return BY_ID.get(zoneId);
}

/**
 * Maps a possibly-stale zone id onto a real one. A save written before the stage list was
 * reshuffled can name a zone that no longer exists; dropping such a player back at the start
 * beats crashing on load.
 */
export function resolveZoneId(zoneId: string | null | undefined): string {
  return zoneId && BY_ID.has(zoneId) ? zoneId : FIRST_STAGE_ID;
}

export function stageIndexOf(zoneId: string): number {
  return STAGES.findIndex((s) => s.id === zoneId);
}

/** The zone this one's exit leads to, or null at the end of the run. */
export function nextStageId(zoneId: string): string | null {
  const i = stageIndexOf(zoneId);
  return i >= 0 && i < STAGES.length - 1 ? STAGES[i + 1].id : null;
}

/** The zone this one's entrance leads back to, or null at the very start. */
export function previousStageId(zoneId: string): string | null {
  const i = stageIndexOf(zoneId);
  return i > 0 ? STAGES[i - 1].id : null;
}

/** Every medal in run order — the Home screen shows these as a progress track. */
export const ALL_MEDALS = STAGES.filter((s) => s.gym).map((s) => s.gym!);

/**
 * Whether the player can walk from one zone into the next. The gate is the medal named on
 * the destination stage, so beating a gym is what physically opens the road.
 */
export function medalRequiredToEnter(zoneId: string): GymDef | null {
  const stage = getStage(zoneId);
  if (!stage?.requiresMedal) return null;
  return ALL_MEDALS.find((m) => m.medalId === stage.requiresMedal) ?? null;
}
