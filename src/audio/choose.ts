import type { TrackId } from "./tracks";

/**
 * Which piece plays where. Kept apart from the screens so the choices can be tested.
 *
 * The map follows the ground under it: a gym stage marches ("Bastions"), a stage that opens on
 * water rocks in 6/8 ("Luzzu"), and everywhere else walks the island roads.
 */
export function mapTrack(stage: { gym?: unknown; biomes: readonly string[] } | undefined): TrackId {
  if (!stage) return "overworld";
  if (stage.gym) return "bastions";
  if (stage.biomes[0] === "water") return "harbour";
  return "overworld";
}

/** Wild creatures get the fast Phrygian clash; trainers the challenge; gym leaders the full band. */
export function battleTrack(trainer: { isGymLeader?: boolean } | null | undefined): TrackId {
  if (!trainer) return "battleWild";
  return trainer.isGymLeader ? "battleGym" : "battleTrainer";
}
