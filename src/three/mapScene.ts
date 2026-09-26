import * as THREE from "three";
import type { CreatureDesign } from "../art/creatureArt";
import type { TileMap, TileType } from "../game/mapData";
import { buildCreatureModel, disposeModel, type CreatureModel } from "./creatureModel";

/**
 * The overworld in 3D. The tile grid the game already plays on is turned into a landscape:
 * terrain whose colours blend from tile to tile, tall grass, limestone rocks, shallow water that
 * moves, carob trees, stone gateways, a domed chapel, trainers, you, and your lead creature
 * trotting behind. The camera follows from behind and above, so "up" on the controls is still
 * "up" on the screen.
 *
 * World units are tiles: column → x, row → z (south is toward the camera).
 */

export type Facing = "up" | "down" | "left" | "right";

export interface MapActor {
  /** Current position in tile units (fractional while walking). */
  position: () => { x: number; y: number };
}

export interface MapTrainer {
  id: string;
  row: number;
  col: number;
  isGymLeader: boolean;
  defeated: boolean;
}

export interface MapSceneApi {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  frame: (dt: number, time: number) => void;
  resize: (width: number, height: number) => void;
  dispose: () => void;
  setFacing: (facing: Facing) => void;
  setFollower: (design: CreatureDesign | null) => void;
  setTrainers: (trainers: MapTrainer[]) => void;
}

// ─── Palette ─────────────────────────────────────────────────────────────────────────────────

const GROUND: Record<TileType, string[]> = {
  grass: ["#5f9e3f", "#6aab48", "#579538", "#73b252"],
  tree: ["#4e8a34", "#568f3a", "#4a8430"],
  rock: ["#cdb995", "#c2ad86", "#d6c4a0", "#b9a37c"],
  sand: ["#e8d09a", "#e0c68e", "#efd9a8"],
  water: ["#c9b48a", "#bfa97f"],
  path: ["#d7bb88", "#cfb27e", "#dcc293"],
  entrance: ["#d7bb88", "#cfb27e"],
  exit: ["#d7bb88", "#cfb27e"],
  heal: ["#d7bb88", "#dcc293"],
};

function seeded(seed: number) {
  let s = seed % 2147483647 || 1;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function std(color: string, options: Partial<THREE.MeshStandardMaterialParameters> = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...options });
}

// ─── Terrain ─────────────────────────────────────────────────────────────────────────────────

/** The ground: one mesh, sub-divided per tile, coloured and gently shaped by what each tile is. */
function buildGround(map: TileMap, random: () => number): THREE.Mesh {
  const rows = map.rows.length;
  const cols = map.rows[0].length;
  const pad = 6; // ground beyond the edges, so the world doesn't end at the last tree
  const sub = 3;
  const geometry = new THREE.PlaneGeometry(cols + pad * 2, rows + pad * 2, (cols + pad * 2) * sub, (rows + pad * 2) * sub);
  geometry.rotateX(-Math.PI / 2);
  // Centre of tile (0,0) sits at world (0,0).
  geometry.translate(cols / 2 - 0.5, 0, rows / 2 - 0.5);
  const position = geometry.attributes.position;
  const colors: number[] = [];
  const tileAt = (x: number, z: number): TileType => {
    const c = Math.round(x);
    const r = Math.round(z);
    return map.rows[Math.max(0, Math.min(rows - 1, r))][Math.max(0, Math.min(cols - 1, c))] ?? "tree";
  };
  const color = new THREE.Color();
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const z = position.getZ(i);
    const outside = x < -0.5 || z < -0.5 || x > cols - 0.5 || z > rows - 0.5;
    const tile = outside ? "tree" : tileAt(x, z);
    const palette = GROUND[tile];
    color.set(palette[Math.floor(random() * palette.length)]);
    color.multiplyScalar(0.94 + random() * 0.1);
    colors.push(color.r, color.g, color.b);
    let height = 0;
    if (tile === "grass" || tile === "tree") height = 0.03 * Math.sin(x * 2.3) * Math.cos(z * 1.9) + random() * 0.02;
    if (tile === "rock") height = 0.05 + random() * 0.05;
    if (tile === "sand") height = 0.015 * Math.sin(x * 5 + z * 2);
    if (tile === "water") height = -0.22;
    if (outside) height = 0.05 * Math.sin(x * 0.7) * Math.cos(z * 0.6) + 0.04;
    position.setY(i, height);
  }
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 }));
  mesh.receiveShadow = true;
  return mesh;
}

/** A single sheet of water over every water tile, rippling in the frame loop. */
function buildWater(map: TileMap): THREE.Mesh | null {
  const tiles: [number, number][] = [];
  map.rows.forEach((row, r) => row.forEach((t, c) => t === "water" && tiles.push([r, c])));
  if (tiles.length === 0) return null;
  const rows = map.rows.length;
  const cols = map.rows[0].length;
  const geometry = new THREE.PlaneGeometry(cols, rows, cols * 2, rows * 2);
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(cols / 2 - 0.5, -0.07, rows / 2 - 0.5);
  const material = new THREE.MeshStandardMaterial({
    color: "#3f9fcf",
    roughness: 0.08,
    metalness: 0.3,
    transparent: true,
    opacity: 0.82,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.receiveShadow = true;
  return mesh;
}

// ─── Instanced scenery ───────────────────────────────────────────────────────────────────────

function instanced(geometry: THREE.BufferGeometry, material: THREE.Material, matrices: THREE.Matrix4[], cast = true): THREE.InstancedMesh {
  const mesh = new THREE.InstancedMesh(geometry, material, Math.max(1, matrices.length));
  matrices.forEach((m, i) => mesh.setMatrixAt(i, m));
  mesh.count = matrices.length;
  mesh.castShadow = cast;
  mesh.receiveShadow = true;
  mesh.instanceMatrix.needsUpdate = true;
  return mesh;
}

const m4 = (x: number, y: number, z: number, s: number | [number, number, number] = 1, ry = 0, rx = 0, rz = 0) => {
  const matrix = new THREE.Matrix4();
  const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz));
  const scale = typeof s === "number" ? new THREE.Vector3(s, s, s) : new THREE.Vector3(...s);
  matrix.compose(new THREE.Vector3(x, y, z), q, scale);
  return matrix;
};

/** A tuft of tall grass: three crossed blades, merged into one shape for instancing. */
function tuftGeometry(): THREE.BufferGeometry {
  const blades: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 3; i++) {
    const blade = new THREE.ConeGeometry(0.022, 0.2, 3);
    blade.translate(0, 0.1, 0);
    blade.rotateZ((i - 1) * 0.35);
    blade.rotateY((i * Math.PI * 2) / 3);
    blades.push(blade);
  }
  return mergeGeometries(blades);
}

/** Minimal geometry merge (positions + normals), enough for these small scenery pieces. */
function mergeGeometries(parts: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const positions: number[] = [];
  const normals: number[] = [];
  for (const part of parts) {
    const g = part.index ? part.toNonIndexed() : part;
    positions.push(...(g.attributes.position.array as Float32Array));
    normals.push(...(g.attributes.normal.array as Float32Array));
  }
  const merged = new THREE.BufferGeometry();
  merged.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  merged.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  return merged;
}

function buildScenery(map: TileMap, random: () => number): THREE.Group {
  const g = new THREE.Group();
  const tufts: THREE.Matrix4[] = [];
  const tuftsLight: THREE.Matrix4[] = [];
  const rocks: THREE.Matrix4[] = [];
  const pebbles: THREE.Matrix4[] = [];
  const trunks: THREE.Matrix4[] = [];
  const crowns: THREE.Matrix4[] = [];
  const crownsLight: THREE.Matrix4[] = [];
  const reeds: THREE.Matrix4[] = [];
  const rows = map.rows.length;
  const cols = map.rows[0].length;

  const placeTree = (x: number, z: number, scale: number) => {
    trunks.push(m4(x, 0.35 * scale, z, [scale, scale, scale], random() * 6, 0, (random() - 0.5) * 0.2));
    for (let i = 0; i < 3; i++) {
      const target = i === 1 ? crownsLight : crowns;
      target.push(m4(x + (random() - 0.5) * 0.35 * scale, (0.78 + random() * 0.25) * scale, z + (random() - 0.5) * 0.35 * scale, (0.28 + random() * 0.12) * scale, random() * 6));
    }
  };

  map.rows.forEach((row, r) => {
    row.forEach((tile, c) => {
      if (tile === "grass") {
        for (let i = 0; i < 12; i++) {
          const target = i % 3 === 0 ? tuftsLight : tufts;
          target.push(m4(c + (random() - 0.5) * 0.95, 0.02, r + (random() - 0.5) * 0.95, 0.7 + random() * 0.7, random() * 6));
        }
      } else if (tile === "rock") {
        const count = 1 + Math.floor(random() * 2);
        for (let i = 0; i < count; i++) rocks.push(m4(c + (random() - 0.5) * 0.6, 0.08, r + (random() - 0.5) * 0.6, [0.14 + random() * 0.14, 0.1 + random() * 0.12, 0.14 + random() * 0.14], random() * 6, random(), random()));
      } else if (tile === "sand") {
        for (let i = 0; i < 2; i++) pebbles.push(m4(c + (random() - 0.5) * 0.8, 0.02, r + (random() - 0.5) * 0.8, 0.035 + random() * 0.03, random() * 6));
      } else if (tile === "path") {
        if (random() > 0.6) pebbles.push(m4(c + (random() - 0.5) * 0.8, 0.01, r + (random() - 0.5) * 0.8, 0.03 + random() * 0.02, random() * 6));
      } else if (tile === "water") {
        if (random() > 0.75) reeds.push(m4(c + (random() - 0.5) * 0.7, -0.15, r + (random() - 0.5) * 0.7, [0.6, 1.3, 0.6], random() * 6));
      } else if (tile === "tree") {
        placeTree(c + (random() - 0.5) * 0.2, r + (random() - 0.5) * 0.2, 0.95 + random() * 0.3);
      }
    });
  });

  // A band of trees outside the map edges, so the world runs on past what you can walk.
  for (let r = -4; r < rows + 4; r++) {
    for (let c = -4; c < cols + 4; c++) {
      if (r >= 0 && r < rows && c >= 0 && c < cols) continue;
      if (random() > 0.45) placeTree(c + (random() - 0.5) * 0.6, r + (random() - 0.5) * 0.6, 0.9 + random() * 0.5);
    }
  }

  g.add(instanced(tuftGeometry(), std("#4f9a33", { roughness: 0.8 }), tufts, false));
  g.add(instanced(tuftGeometry(), std("#7dbb52", { roughness: 0.8 }), tuftsLight, false));
  g.add(instanced(new THREE.DodecahedronGeometry(1, 0), std("#d2bf9a", { roughness: 0.95, flatShading: true }), rocks));
  g.add(instanced(new THREE.DodecahedronGeometry(1, 0), std("#efe6d2", { roughness: 0.6 }), pebbles, false));
  g.add(instanced(new THREE.CylinderGeometry(0.06, 0.1, 0.7, 6), std("#6b4f35", { roughness: 0.95 }), trunks));
  g.add(instanced(new THREE.IcosahedronGeometry(1, 1), std("#4a7d35", { roughness: 0.85, flatShading: true }), crowns));
  g.add(instanced(new THREE.IcosahedronGeometry(1, 1), std("#5e9243", { roughness: 0.85, flatShading: true }), crownsLight));
  g.add(instanced(tuftGeometry(), std("#7d9a4a", { roughness: 0.8 }), reeds, false));
  return g;
}

// ─── Buildings and people ────────────────────────────────────────────────────────────────────

/** A stone gateway — the way in or out of a stage. */
function gate(isExit: boolean): THREE.Group {
  const g = new THREE.Group();
  const stone = std("#dccaa2", { roughness: 0.9, flatShading: true });
  for (const side of [-1, 1]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.8, 0.11), stone);
    post.position.set(side * 0.44, 0.4, 0);
    post.castShadow = true;
    g.add(post);
  }
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.11, 0.15), stone);
  lintel.position.y = 0.84;
  lintel.castShadow = true;
  g.add(lintel);
  // A glowing threshold so the way on is obvious.
  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(0.6, 0.8),
    new THREE.MeshBasicMaterial({ color: isExit ? "#ffe8a0" : "#cfe8ff", transparent: true, opacity: 0.45, side: THREE.DoubleSide })
  );
  glow.position.y = 0.45;
  glow.userData.pulse = true;
  g.add(glow);
  return g;
}

/** A small Maltese chapel: limestone walls, a red door, a dome on a drum, a bell-cot and a cross. */
function chapel(): THREE.Group {
  const g = new THREE.Group();
  const limestone = std("#e3cf9f", { roughness: 0.9 });
  const nave = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.45, 0.7), limestone);
  nave.position.y = 0.225;
  nave.castShadow = true;
  nave.receiveShadow = true;
  g.add(nave);
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.14, 16), limestone);
  drum.position.set(0, 0.52, -0.05);
  drum.castShadow = true;
  g.add(drum);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.21, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), std("#c9423a", { roughness: 0.6 }));
  dome.position.set(0, 0.59, -0.05);
  dome.castShadow = true;
  g.add(dome);
  const lantern = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.1, 8), limestone);
  lantern.position.set(0, 0.83, -0.05);
  g.add(lantern);
  const cross = new THREE.Group();
  const white = std("#ffffff", { roughness: 0.4 });
  const v = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.14, 0.03), white);
  const h = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.03, 0.03), white);
  h.position.y = 0.03;
  cross.add(v, h);
  cross.position.set(0, 0.94, -0.05);
  g.add(cross);
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.24, 0.02), std("#7a2f25", { roughness: 0.7 }));
  door.position.set(0, 0.12, 0.351);
  g.add(door);
  const cot = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.16, 0.06), limestone);
  cot.position.set(0, 0.53, 0.33);
  cot.castShadow = true;
  g.add(cot);
  // A faint green shimmer over the door: the healing spot.
  const glow = new THREE.Mesh(new THREE.CircleGeometry(0.3, 24), new THREE.MeshBasicMaterial({ color: "#8dffb0", transparent: true, opacity: 0.35 }));
  glow.rotation.x = -Math.PI / 2;
  glow.position.set(0, 0.02, 0.55);
  glow.userData.pulse = true;
  g.add(glow);
  return g;
}

interface PersonLook {
  shirt: string;
  trousers: string;
  skin: string;
  hair: string;
  hat?: string;
  cape?: string;
}

/** A person, built simply but lit and shadowed like everything else. */
function person(look: PersonLook): { group: THREE.Group; legs: THREE.Object3D[]; arms: THREE.Object3D[]; materials: THREE.MeshStandardMaterial[] } {
  const group = new THREE.Group();
  const materials: THREE.MeshStandardMaterial[] = [];
  const mat = (c: string, o: Partial<THREE.MeshStandardMaterialParameters> = {}) => {
    const m = std(c, { roughness: 0.7, ...o });
    materials.push(m);
    return m;
  };
  const add = (geo: THREE.BufferGeometry, material: THREE.Material, x: number, y: number, z: number, parent: THREE.Object3D = group) => {
    const mesh = new THREE.Mesh(geo, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
  };
  const legs: THREE.Object3D[] = [];
  const arms: THREE.Object3D[] = [];
  for (const side of [-1, 1]) {
    const hip = new THREE.Group();
    hip.position.set(side * 0.06, 0.24, 0);
    group.add(hip);
    add(new THREE.CapsuleGeometry(0.045, 0.14, 4, 8), mat(look.trousers), 0, -0.12, 0, hip);
    add(new THREE.BoxGeometry(0.07, 0.04, 0.11), mat("#3a2a20"), 0, -0.22, 0.02, hip);
    legs.push(hip);
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.13, 0.46, 0);
    group.add(shoulder);
    add(new THREE.CapsuleGeometry(0.035, 0.14, 4, 8), mat(look.shirt), 0, -0.09, 0, shoulder);
    add(new THREE.SphereGeometry(0.035, 8, 6), mat(look.skin), 0, -0.19, 0, shoulder);
    arms.push(shoulder);
  }
  add(new THREE.CapsuleGeometry(0.1, 0.16, 6, 12), mat(look.shirt), 0, 0.38, 0);
  add(new THREE.SphereGeometry(0.1, 16, 12), mat(look.skin), 0, 0.62, 0);
  const hair = add(new THREE.SphereGeometry(0.105, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2.2), mat(look.hair), 0, 0.635, -0.01);
  hair.rotation.x = -0.25;
  for (const side of [-1, 1]) add(new THREE.SphereGeometry(0.014, 6, 4), mat("#1d2328"), side * 0.035, 0.63, 0.09);
  if (look.hat) {
    add(new THREE.CylinderGeometry(0.14, 0.14, 0.015, 16), mat(look.hat), 0, 0.7, 0);
    add(new THREE.CylinderGeometry(0.08, 0.09, 0.08, 16), mat(look.hat), 0, 0.74, 0);
  }
  if (look.cape) {
    const cape = add(new THREE.BoxGeometry(0.26, 0.36, 0.02), mat(look.cape, { side: THREE.DoubleSide }), 0, 0.34, -0.1);
    cape.rotation.x = 0.12;
  }
  return { group, legs, arms, materials };
}

// ─── Scene ───────────────────────────────────────────────────────────────────────────────────

export function createMapScene(map: TileMap, player: MapActor, follower: MapActor, options: { reducedMotion?: boolean } = {}): MapSceneApi {
  const random = seeded(map.zoneId.split("").reduce((h, ch) => h * 31 + ch.charCodeAt(0), 7));
  const scene = new THREE.Scene();
  const sky = new THREE.Color("#bfe0f2");
  scene.background = sky;
  scene.fog = new THREE.Fog(sky, 7, 17);

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 80);
  scene.add(new THREE.HemisphereLight("#dff0ff", "#7a8f5a", 0.95));
  const sun = new THREE.DirectionalLight("#fff0d4", 2.3);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -8;
  sun.shadow.camera.right = 8;
  sun.shadow.camera.top = 8;
  sun.shadow.camera.bottom = -8;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 30;
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 0.03;
  scene.add(sun, sun.target);

  scene.add(buildGround(map, random));
  const water = buildWater(map);
  if (water) scene.add(water);
  scene.add(buildScenery(map, random));

  const pulsing: THREE.Mesh[] = [];
  map.rows.forEach((row, r) =>
    row.forEach((tile, c) => {
      let building: THREE.Group | null = null;
      if (tile === "entrance" || tile === "exit") building = gate(tile === "exit");
      if (tile === "heal") building = chapel();
      if (!building) return;
      building.position.set(c, 0, r);
      // Gates stand across the road at the tile's outer edge — west for the way back, east for
      // the way on — so you stand beside the arch rather than hidden behind a post.
      if (tile !== "heal") {
        building.rotation.y = Math.PI / 2;
        building.position.x += tile === "entrance" ? -0.46 : 0.46;
      }
      building.traverse((o) => o.userData.pulse && pulsing.push(o as THREE.Mesh));
      scene.add(building);
    })
  );

  // You.
  const hero = person({ shirt: "#d4453a", trousers: "#2f4f7a", skin: "#f1c9a5", hair: "#5a3a22", hat: "#f2e3b3" });
  scene.add(hero.group);
  let facing: Facing = "down";
  const facingAngle: Record<Facing, number> = { down: 0, up: Math.PI, left: -Math.PI / 2, right: Math.PI / 2 };
  let heroAngle = 0;
  let lastHero = player.position();
  let stride = 0;

  // Your lead creature.
  let followerModel: CreatureModel | null = null;
  const followerHolder = new THREE.Group();
  scene.add(followerHolder);
  let lastFollower = follower.position();
  let followerAngle = 0;

  // Trainers.
  const trainerGroup = new THREE.Group();
  scene.add(trainerGroup);
  const trainerFigures: { id: string; group: THREE.Group; materials: THREE.MeshStandardMaterial[]; phase: number }[] = [];
  function setTrainers(trainers: MapTrainer[]) {
    for (const figure of trainerFigures) trainerGroup.remove(figure.group);
    trainerFigures.length = 0;
    for (const t of trainers) {
      const look: PersonLook = t.isGymLeader
        ? { shirt: "#7a2f8f", trousers: "#2b2b3b", skin: "#e8b98f", hair: "#1d1d1d", cape: "#c9a227" }
        : { shirt: "#2f7f6a", trousers: "#4a3a2a", skin: "#f0c8a0", hair: "#3a2a1a" };
      const figure = person(look);
      figure.group.position.set(t.col, 0, t.row);
      figure.group.scale.setScalar(t.isGymLeader ? 1.15 : 1);
      if (t.defeated) {
        // Beaten trainers sit down on the verge, greyed out.
        figure.group.position.y = -0.06;
        for (const m of figure.materials) m.color.lerp(new THREE.Color("#9a9a9a"), 0.55);
      }
      trainerGroup.add(figure.group);
      trainerFigures.push({ id: t.id, group: figure.group, materials: figure.materials, phase: t.row * 1.3 + t.col });
    }
  }

  function setFollower(design: CreatureDesign | null) {
    if (followerModel) {
      followerHolder.remove(followerModel.group);
      disposeModel(followerModel);
      followerModel = null;
    }
    if (!design) return;
    followerModel = buildCreatureModel(design);
    followerModel.group.scale.setScalar(0.55);
    followerHolder.add(followerModel.group);
  }

  const camTarget = new THREE.Vector3();
  const camPos = new THREE.Vector3();
  let cameraReady = false;
  const offset = new THREE.Vector3(0, 4.4, 4.2);

  function frame(dt: number, time: number) {
    const p = player.position();
    const moved = Math.hypot(p.x - lastHero.x, p.y - lastHero.y);
    lastHero = p;
    stride += moved * 9;
    const walking = moved > 0.0005;
    hero.group.position.set(p.x, walking ? Math.abs(Math.sin(stride)) * 0.03 : 0, p.y);
    const targetAngle = facingAngle[facing];
    let delta = targetAngle - heroAngle;
    delta = Math.atan2(Math.sin(delta), Math.cos(delta));
    heroAngle += delta * Math.min(1, dt * 14);
    hero.group.rotation.y = heroAngle;
    const swing = walking ? Math.sin(stride) * 0.6 : 0;
    hero.legs.forEach((leg, i) => (leg.rotation.x = i === 0 ? swing : -swing));
    hero.arms.forEach((arm, i) => (arm.rotation.x = i === 0 ? -swing * 0.8 : swing * 0.8));

    if (followerModel) {
      const f = follower.position();
      const fm = Math.hypot(f.x - lastFollower.x, f.y - lastFollower.y);
      if (fm > 0.0005) followerAngle = Math.atan2(f.x - lastFollower.x, f.y - lastFollower.y);
      lastFollower = f;
      const hop = fm > 0.0005 ? Math.abs(Math.sin(time * 14)) * 0.05 : 0;
      followerHolder.position.set(f.x, hop + (followerModel.hovers ? 0.1 + Math.sin(time * 2.2) * 0.04 : 0), f.y);
      followerHolder.rotation.y = followerAngle;
      for (const part of followerModel.swaying) {
        if (part.userData.spin) part.rotation.y += dt * 6;
        else if (part.userData.flap) part.rotation.z = Math.sin(time * 9) * 0.35 * part.userData.flap;
        else part.rotation.z = Math.sin(time * 1.8 + part.id) * 0.12;
      }
    }

    // Trainers turn to watch you as you pass.
    for (const figure of trainerFigures) {
      const dx = p.x - figure.group.position.x;
      const dz = p.y - figure.group.position.z;
      const want = Math.hypot(dx, dz) < 5 ? Math.atan2(dx, dz) : Math.sin(time * 0.3 + figure.phase) * 0.6;
      let d = want - figure.group.rotation.y;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      figure.group.rotation.y += d * Math.min(1, dt * 4);
    }

    for (const mesh of pulsing) {
      (mesh.material as THREE.MeshBasicMaterial).opacity = 0.3 + Math.sin(time * 2.5) * 0.12;
    }

    if (water) {
      const position = (water.geometry as THREE.BufferGeometry).attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < position.count; i++) {
        const x = position.getX(i);
        const z = position.getZ(i);
        position.setY(i, -0.07 + Math.sin(x * 2.1 + time * 1.4) * 0.018 + Math.cos(z * 2.4 + time * 1.1) * 0.018);
      }
      position.needsUpdate = true;
      water.geometry.computeVertexNormals();
    }

    // The camera follows from behind and above, easing so steps feel smooth.
    camTarget.set(p.x, 0.3, p.y - 0.6);
    const wantPos = new THREE.Vector3(p.x, 0, p.y).add(offset);
    if (!cameraReady) {
      camPos.copy(wantPos);
      cameraReady = true;
    }
    camPos.lerp(wantPos, options.reducedMotion ? 1 : Math.min(1, dt * 5));
    camera.position.copy(camPos);
    camera.lookAt(camTarget.x + (camPos.x - wantPos.x), camTarget.y, camTarget.z + (camPos.z - wantPos.z));

    // Keep the sun's shadows centred on you, so they stay sharp wherever you walk.
    sun.position.set(p.x - 4, 9, p.y + 3);
    sun.target.position.set(p.x, 0, p.y);
  }

  function resize(width: number, height: number) {
    camera.aspect = width / Math.max(1, height);
    // Tall phone screens see more of the map ahead; wide screens a broader sweep.
    camera.fov = camera.aspect < 0.8 ? 58 : 44;
    camera.updateProjectionMatrix();
  }

  function dispose() {
    if (followerModel) disposeModel(followerModel);
    scene.traverse((object) => {
      const mesh = object as THREE.Mesh;
      mesh.geometry?.dispose();
      const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(material)) material.forEach((m) => m.dispose());
      else material?.dispose?.();
    });
  }

  return {
    scene,
    camera,
    frame,
    resize,
    dispose,
    setFacing: (f) => {
      facing = f;
    },
    setFollower,
    setTrainers,
  };
}
