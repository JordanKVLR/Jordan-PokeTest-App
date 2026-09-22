import { getMap } from "./mapData";
import { getStage, STAGES } from "./zoneProgression";

export interface ZoneEncounterSettings {
  baseLevel: number;
  levelSpread?: number;
  /** Hard floor for the ultra-rare legendary encounter in this zone — always well above the
   * zone's normal wild-level range, and higher again in each later zone. */
  legendaryMinLevel: number;
}

const DEFAULT_SETTINGS: ZoneEncounterSettings = {
  baseLevel: STAGES[0].baseLevel,
  levelSpread: STAGES[0].levelSpread,
  legendaryMinLevel: STAGES[0].legendaryMinLevel,
};

/** Encounter difficulty comes straight off the stage table, so the curve is defined in one place. */
export function getZoneEncounterSettings(zoneId: string): ZoneEncounterSettings {
  const stage = getStage(zoneId);
  if (!stage) return DEFAULT_SETTINGS;
  return {
    baseLevel: stage.baseLevel,
    levelSpread: stage.levelSpread,
    legendaryMinLevel: stage.legendaryMinLevel,
  };
}

export function getZoneName(zoneId: string): string {
  return getMap(zoneId).zoneName;
}
