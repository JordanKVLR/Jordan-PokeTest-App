import { getMap, isWalkable, biomeAt, isExitTile, isEntranceTile, isHealTile, findTilePosition } from "../mapData";
import { STAGES, getStage, nextStageId, previousStageId, ALL_MEDALS } from "../zoneProgression";
import { trainersForZone, gymLeaderForZone } from "../trainers";

/** Flood fill from a start tile across walkable tiles. */
function reachableFrom(zoneId: string, start: { row: number; col: number }): Set<string> {
  const map = getMap(zoneId);
  const seen = new Set<string>([`${start.row},${start.col}`]);
  const queue = [start];
  while (queue.length) {
    const { row, col } = queue.shift()!;
    for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]] as const) {
      const r = row + dr;
      const c = col + dc;
      const key = `${r},${c}`;
      if (seen.has(key) || !isWalkable(map, r, c)) continue;
      seen.add(key);
      queue.push({ row: r, col: c });
    }
  }
  return seen;
}

describe("stage progression", () => {
  it("runs 20 stages with a gym every fifth one", () => {
    expect(STAGES).toHaveLength(20);
    const gymStages = STAGES.filter((s) => s.gym).map((s) => s.stage);
    expect(gymStages).toEqual([5, 10, 15, 20]);
    expect(ALL_MEDALS).toHaveLength(4);
  });

  it("raises the wild level every stage, with no plateaus or dips", () => {
    for (let i = 1; i < STAGES.length; i++) {
      expect(STAGES[i].baseLevel).toBeGreaterThan(STAGES[i - 1].baseLevel);
    }
    expect(STAGES[0].baseLevel).toBeLessThan(8);
    expect(STAGES[STAGES.length - 1].baseLevel).toBeGreaterThan(50);
  });

  it("gates the stage after each gym behind that gym's medal", () => {
    for (const gymStage of STAGES.filter((s) => s.gym)) {
      const next = STAGES.find((s) => s.stage === gymStage.stage + 1);
      if (!next) continue; // the final gym ends the run
      expect(next.requiresMedal).toBe(gymStage.gym!.medalId);
    }
  });

  it("chains every stage to its neighbours", () => {
    expect(previousStageId(STAGES[0].id)).toBeNull();
    expect(nextStageId(STAGES[STAGES.length - 1].id)).toBeNull();
    for (let i = 0; i < STAGES.length - 1; i++) {
      expect(nextStageId(STAGES[i].id)).toBe(STAGES[i + 1].id);
      expect(previousStageId(STAGES[i + 1].id)).toBe(STAGES[i].id);
    }
  });
});

describe("generated zone maps", () => {
  it.each(STAGES.map((s) => [s.id, s.name]))("%s (%s) is fully traversable", (zoneId) => {
    const map = getMap(zoneId);
    const reachable = reachableFrom(zoneId, map.playerStart);

    const exit = findTilePosition(map, "exit");
    expect(exit).not.toBeNull();
    expect(reachable.has(`${exit!.row},${exit!.col}`)).toBe(true);

    const heal = findTilePosition(map, "heal");
    expect(heal).not.toBeNull();
    expect(reachable.has(`${heal!.row},${heal!.col}`)).toBe(true);
  });

  it.each(STAGES.map((s) => [s.id]))("%s puts every trainer somewhere reachable", (zoneId) => {
    const map = getMap(zoneId);
    const reachable = reachableFrom(zoneId, map.playerStart);
    for (const trainer of trainersForZone(zoneId)) {
      expect(reachable.has(`${trainer.position.row},${trainer.position.col}`)).toBe(true);
    }
    const gym = gymLeaderForZone(zoneId);
    if (gym) expect(reachable.has(`${gym.position.row},${gym.position.col}`)).toBe(true);
  });

  it("is deterministic — the same zone builds identically every time", () => {
    const first = getMap("dingli_cliffs").rows.map((r) => r.join("")).join("|");
    const second = getMap("dingli_cliffs").rows.map((r) => r.join("")).join("|");
    expect(second).toBe(first);
  });

  it("gives each zone both of its stage's biomes to find encounters in", () => {
    for (const stage of STAGES) {
      const map = getMap(stage.id);
      const found = new Set<string>();
      for (let r = 0; r < map.rows.length; r++) {
        for (let c = 0; c < map.rows[r].length; c++) {
          const biome = biomeAt(map, r, c);
          if (biome) found.add(biome);
        }
      }
      for (const biome of stage.biomes) expect(found.has(biome)).toBe(true);
    }
  });

  it("marks the entrance, exit and heal tiles as their own kinds", () => {
    const map = getMap("melita_woods");
    const entrance = map.playerStart;
    expect(isEntranceTile(map, entrance.row, entrance.col)).toBe(true);
    const exit = findTilePosition(map, "exit")!;
    expect(isExitTile(map, exit.row, exit.col)).toBe(true);
    const heal = findTilePosition(map, "heal")!;
    expect(isHealTile(map, heal.row, heal.col)).toBe(true);
  });

  it("names every zone from its stage definition", () => {
    for (const stage of STAGES) {
      expect(getMap(stage.id).zoneName).toBe(getStage(stage.id)!.name);
    }
  });
});
