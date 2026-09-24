import type { SpawnBiome } from "../data/schemas";
import type { BiomeType } from "./mapData";

/**
 * Whether a creature tagged with `spawnBiome` can turn up on a tile of `biome`.
 *
 * Almost everything is tied to one terrain — a Water creature belongs in the shallows and
 * nowhere else. The exception is "any", which the Normal types carry: the harbour cat, the
 * rabbit hound and the rock dove are the island's ordinary animals, at home on every kind of
 * ground, so they roll on all four biome tables instead of one.
 */
export function spawnsIn(spawnBiome: SpawnBiome, biome: BiomeType): boolean {
  return spawnBiome === "any" || spawnBiome === biome;
}

/** Whether a creature can appear anywhere in a zone built from these biomes. */
export function spawnsInZone(spawnBiome: SpawnBiome, zoneBiomes: readonly BiomeType[]): boolean {
  return spawnBiome === "any" || zoneBiomes.includes(spawnBiome);
}
