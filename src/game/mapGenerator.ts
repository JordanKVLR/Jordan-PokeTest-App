import type { BiomeType, TileType } from "./mapData";
import type { StageDef } from "./zoneProgression";

/**
 * Zones are generated rather than hand-drawn, because there are twenty of them and each one
 * still has to be guaranteed walkable end to end. The generator is deterministic — seeded off
 * the zone id — so a given zone is byte-identical every time it is built, and a player's
 * mental map of it stays true across sessions.
 *
 * The shape is always: a carved path from the entrance to the exit (the guarantee), biome
 * patches either side of it (the encounters), trees around the rim (the boundary), a Healing
 * Centre near the start, and trainer positions spaced along the route.
 */

export interface GeneratedMap {
  rows: TileType[][];
  playerStart: { row: number; col: number };
  /** Walkable tiles reserved for trainers, in route order (earliest first). */
  trainerSpots: Array<{ row: number; col: number }>;
  /** Where the gym leader stands, for zones that have a gym. */
  gymSpot: { row: number; col: number } | null;
}

/** Small deterministic PRNG (mulberry32) — same seed, same map, forever. */
function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedFrom(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const WIDTH = 17;
const HEIGHT = 15;

export function generateZoneMap(stage: StageDef): GeneratedMap {
  const rng = makeRng(seedFrom(stage.id));
  const [biomeA, biomeB] = stage.biomes;

  // Start solid, then carve. Easier to guarantee a boundary this way than to patch one on.
  const grid: TileType[][] = Array.from({ length: HEIGHT }, () =>
    Array.from({ length: WIDTH }, () => "tree" as TileType)
  );

  const openInterior = (fill: BiomeType) => {
    for (let r = 1; r < HEIGHT - 1; r++) {
      for (let c = 1; c < WIDTH - 1; c++) grid[r][c] = fill;
    }
  };
  openInterior(biomeA);

  // Patches of the second biome, so a zone reads as two terrains meeting rather than one
  // flat field with speckles.
  const patchCount = 3 + Math.floor(rng() * 3);
  for (let p = 0; p < patchCount; p++) {
    const cr = 2 + Math.floor(rng() * (HEIGHT - 4));
    const cc = 2 + Math.floor(rng() * (WIDTH - 4));
    const radius = 1 + Math.floor(rng() * 2.6);
    for (let r = cr - radius; r <= cr + radius; r++) {
      for (let c = cc - radius; c <= cc + radius; c++) {
        if (r <= 0 || c <= 0 || r >= HEIGHT - 1 || c >= WIDTH - 1) continue;
        if (Math.abs(r - cr) + Math.abs(c - cc) <= radius) grid[r][c] = biomeB;
      }
    }
  }

  // Tree clumps as obstacles. The path is carved after this, so they can never seal the route.
  const clumps = 5 + Math.floor(rng() * 4);
  for (let t = 0; t < clumps; t++) {
    const cr = 2 + Math.floor(rng() * (HEIGHT - 4));
    const cc = 2 + Math.floor(rng() * (WIDTH - 4));
    const size = 1 + Math.floor(rng() * 3);
    for (let i = 0; i < size; i++) {
      const r = Math.min(HEIGHT - 2, Math.max(1, cr + Math.floor(rng() * 3) - 1));
      const c = Math.min(WIDTH - 2, Math.max(1, cc + Math.floor(rng() * 3) - 1));
      grid[r][c] = "tree";
    }
  }

  // The carved route: a two-lane road running west to east, bending only gently. It used to be
  // a drunken walk, which made every zone a small maze — you could not see where the exit was
  // and had to wander to find it. A player who wants to push on to the next stage should be
  // able to see the way out and take it, so the road now holds close to the middle of the map,
  // moves at most one row per column, and is two tiles wide for its whole length. Path tiles
  // carry no biome, so the road is also the one line through the zone that spawns no wild
  // encounters: taking it is genuinely the fast way through.
  const midRow = Math.floor(HEIGHT / 2);
  const drift = () => Math.floor(rng() * 3) - 1;
  const startRow = Math.min(HEIGHT - 3, Math.max(2, midRow + drift()));
  const endRow = Math.min(HEIGHT - 3, Math.max(2, midRow + drift()));

  const route: Array<{ row: number; col: number }> = [];
  let r = startRow;
  for (let c = 1; c <= WIDTH - 2; c++) {
    const progress = (c - 1) / (WIDTH - 3);
    const target = Math.round(startRow + (endRow - startRow) * progress);
    if (r < target) r++;
    else if (r > target) r--;
    r = Math.min(HEIGHT - 3, Math.max(1, r));

    grid[r][c] = "path";
    // The second lane is always carved, never occasionally — a road that narrows to one tile
    // is a road a single obstacle can cork.
    grid[r + 1][c] = "path";
    route.push({ row: r, col: c });
  }

  // Connect the west edge down to wherever the walk actually began, then stamp the entrance
  // last — the route carver runs through column 1 too, and would otherwise pave over it.
  const entrance = { row: startRow, col: 1 };
  const lo = Math.min(route[0].row, entrance.row);
  const hi = Math.max(route[0].row, entrance.row);
  for (let rr = lo; rr <= hi; rr++) grid[rr][1] = "path";
  grid[entrance.row][entrance.col] = "entrance";

  const last = route[route.length - 1];
  grid[last.row][WIDTH - 2] = "path";
  const exit = { row: last.row, col: WIDTH - 2 };
  grid[exit.row][exit.col] = "exit";

  // Healing Centre just off the road near the start — somewhere to fall back to.
  const healAnchor = route[Math.min(2, route.length - 1)];
  const healRow = Math.min(HEIGHT - 2, Math.max(1, healAnchor.row - 1));
  if (grid[healRow][healAnchor.col] !== "exit" && grid[healRow][healAnchor.col] !== "entrance") {
    grid[healRow][healAnchor.col] = "heal";
  } else {
    grid[Math.min(HEIGHT - 2, healAnchor.row + 1)][healAnchor.col] = "heal";
  }

  // Trainers wait at the roadside rather than standing in the middle of it. Beating every one
  // of them is a win condition, so they all have to be reachable — but blocking the road with
  // them would mean the only way to the next stage was through every battle in order, and a
  // player who wants to run the route should be able to. They stand one tile off the road,
  // in plain sight, and you walk into them when you want the fight.
  const trainerSpots: Array<{ row: number; col: number }> = [];
  const wanted = 2 + (stage.stage % 3 === 0 ? 2 : 1);
  const spacing = Math.floor(route.length / (wanted + 1));
  const isFree = (row: number, col: number) => {
    const tile = grid[row]?.[col];
    if (tile === undefined || tile === "tree" || tile === "entrance" || tile === "exit" || tile === "heal") return false;
    return !trainerSpots.some((s) => s.row === row && s.col === col);
  };
  for (let i = 1; i <= wanted; i++) {
    const anchor = route[Math.min(route.length - 3, i * spacing)];
    if (!anchor) continue;
    // Above the road, then below it, then on the far lane — the first tile that will take them.
    const candidates = [
      { row: anchor.row - 1, col: anchor.col },
      { row: anchor.row + 2, col: anchor.col },
      { row: anchor.row + 1, col: anchor.col },
    ];
    const spot = candidates.find((c) => isFree(c.row, c.col));
    if (spot) trainerSpots.push(spot);
  }

  // The gym leader is the exception: they stand in the road itself, right before the exit, so
  // you cannot miss them on the way out. They are not a wall — every tile that isn't a tree is
  // walkable, so nobody is ever physically sealed in — the gate is the medal check the next
  // stage's entrance runs (see medalRequiredToEnter). Standing here just means the player meets
  // the boss at the point where the medal starts to matter.
  const gymSpot = stage.gym ? { ...route[route.length - 2] } : null;
  if (gymSpot) grid[gymSpot.row][gymSpot.col] = "path";

  return { rows: grid, playerStart: entrance, trainerSpots, gymSpot };
}
