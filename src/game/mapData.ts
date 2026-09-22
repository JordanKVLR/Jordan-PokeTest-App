import { generateZoneMap } from "./mapGenerator";
import { getStage, nextStageId, previousStageId } from "./zoneProgression";

/** The four terrain types that can trigger a wild encounter — each zone mixes at least two of
 * these, and each biome draws from its own themed wild-creature pool (see encounterTable.ts). */
export type BiomeType = "grass" | "rock" | "water" | "sand";

export const BIOME_TYPES: BiomeType[] = ["grass", "rock", "water", "sand"];

export type TileType = "tree" | "path" | "entrance" | "exit" | "heal" | BiomeType;

export interface TileMap {
  zoneId: string;
  zoneName: string;
  rows: TileType[][];
  playerStart: { row: number; col: number };
  /** Zone id the exit tile leads to, or null if this is the current end of the line. */
  exitTo: string | null;
  /** Zone id the entrance tile leads back to, or null for the very first zone. */
  previousZoneId: string | null;
}

/**
 * The 20-stage run is generated from zoneProgression.ts rather than hand-drawn: see
 * mapGenerator.ts for the shape and why it is deterministic. Maps are built once, lazily, and
 * cached, so repeated visits to a zone get the identical grid.
 */
const mapCache = new Map<string, TileMap>();

function buildMap(zoneId: string): TileMap {
  const stage = getStage(zoneId);
  if (!stage) throw new Error(`Unknown zone: ${zoneId}`);
  const generated = generateZoneMap(stage);
  return {
    zoneId,
    zoneName: stage.name,
    rows: generated.rows,
    playerStart: generated.playerStart,
    exitTo: nextStageId(zoneId),
    previousZoneId: previousStageId(zoneId),
  };
}

export function getMap(zoneId: string): TileMap {
  const cached = mapCache.get(zoneId);
  if (cached) return cached;
  const built = buildMap(zoneId);
  mapCache.set(zoneId, built);
  return built;
}

export function tileAt(map: TileMap, row: number, col: number): TileType | undefined {
  return map.rows[row]?.[col];
}

export function isWalkable(map: TileMap, row: number, col: number): boolean {
  return tileAt(map, row, col) !== undefined && tileAt(map, row, col) !== "tree";
}

/** Which biome tile (if any) this position is — used both to trigger an encounter and to pick
 * that biome's themed wild-creature pool (see encounterTable.ts). */
export function biomeAt(map: TileMap, row: number, col: number): BiomeType | null {
  const tile = tileAt(map, row, col);
  return tile && (BIOME_TYPES as string[]).includes(tile) ? (tile as BiomeType) : null;
}

export function isEncounterTile(map: TileMap, row: number, col: number): boolean {
  return biomeAt(map, row, col) !== null;
}

export function isExitTile(map: TileMap, row: number, col: number): boolean {
  return tileAt(map, row, col) === "exit";
}

export function isEntranceTile(map: TileMap, row: number, col: number): boolean {
  return tileAt(map, row, col) === "entrance";
}

export function isHealTile(map: TileMap, row: number, col: number): boolean {
  return tileAt(map, row, col) === "heal";
}

/** Scans a map for the (first) tile of the given type — used to find a zone's exit position
 * from the outside, e.g. so returning to a previous zone lands the player exactly where they
 * left it. Assumes at most one tile of that type per map, true for "exit"/"entrance"/"heal". */
export function findTilePosition(map: TileMap, tileType: TileType): { row: number; col: number } | null {
  for (let row = 0; row < map.rows.length; row++) {
    const col = map.rows[row].indexOf(tileType);
    if (col !== -1) return { row, col };
  }
  return null;
}
