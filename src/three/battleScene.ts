import * as THREE from "three";
import type { CreatureDesign } from "../art/creatureArt";
import type { Biome, TypeName } from "../data/schemas";
import { buildCreatureModel, disposeModel, type CreatureModel } from "./creatureModel";

/**
 * The battle, in three dimensions. The player's creature stands in the foreground, lower left,
 * seen from behind its shoulder; the opponent faces it across the field, upper right — the
 * same places the 2D stage uses, so the name plates still sit beside the right creature.
 *
 * Everything is procedural: sky, terrain, scenery and creatures are built from code, lit by a
 * low Mediterranean sun that casts real shadows.
 */

export interface AnimSample {
  shakeX: number;
  scale: number;
  opacity: number;
  hitFlash: number;
  healFlash: number;
}

export interface BattleSceneApi {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  frame: (dt: number, time: number) => void;
  resize: (width: number, height: number) => void;
  dispose: () => void;
  setCreature: (side: "player" | "enemy", design: CreatureDesign) => void;
  setAnimSource: (side: "player" | "enemy", sample: () => AnimSample) => void;
  fireProjectile: (type: TypeName, direction: "toEnemy" | "toPlayer", durationMs: number) => void;
  throwBall: (durationMs: number) => void;
  cruxBurst: () => void;
  itemFlash: (tint: string) => void;
}

const PLAYER_POS = new THREE.Vector3(-1.5, 0, 1.6);
const ENEMY_POS = new THREE.Vector3(2.4, 0, -3.4);
const PLAYER_SCALE = 1.3;
const ENEMY_SCALE = 1.25;

const TYPE_GLOW: Record<TypeName, string> = {
  Normal: "#e8e2d0", Fire: "#ff7a2a", Water: "#3fa0ff", Grass: "#5fd05a", Electric: "#ffe03a", Ice: "#9fe8ff",
  Fighting: "#e05a3a", Poison: "#b05ae0", Ground: "#d9a45f", Flying: "#a8c8ff", Psychic: "#ff5aa8", Bug: "#a8d03a",
  Rock: "#c9a86a", Ghost: "#8a6ae0", Dragon: "#6a5aff", Dark: "#5a4a6a", Steel: "#c8d4e0", Fairy: "#ffa8e0",
};

interface BiomeLook {
  skyTop: string;
  skyHorizon: string;
  ground: string[];
  platform: string;
  platformRim: string;
  fog: number;
}

const LOOKS: Record<Biome, BiomeLook> = {
  grass: { skyTop: "#2f7fd0", skyHorizon: "#bfe0f2", ground: ["#6aa84a", "#7fb85a", "#5d9a40", "#8cbf5f"], platform: "#8cc460", platformRim: "#5e8f3c", fog: 0.016 },
  rock: { skyTop: "#4a8cc8", skyHorizon: "#e6e0d0", ground: ["#c9b48d", "#bfa77c", "#d6c39c", "#b39a70"], platform: "#d8c49a", platformRim: "#a8905f", fog: 0.02 },
  sand: { skyTop: "#3f96d8", skyHorizon: "#f6e8c8", ground: ["#e6cc94", "#dcc088", "#efd8a4", "#d4b67c"], platform: "#ecd6a2", platformRim: "#c4a46c", fog: 0.015 },
  water: { skyTop: "#2f86d0", skyHorizon: "#d4ecf6", ground: ["#2f7fae", "#3a8cbc", "#2a74a0", "#4496c4"], platform: "#c9b48d", platformRim: "#9c8458", fog: 0.014 },
};

// ─── Small helpers ───────────────────────────────────────────────────────────────────────────

/** A soft round glow, drawn once into a canvas, used for every sparkle and projectile. */
function glowTexture(): THREE.Texture {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const g = canvas.getContext("2d")!;
  const gradient = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.25, "rgba(255,255,255,0.85)");
  gradient.addColorStop(0.6, "rgba(255,255,255,0.25)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gradient;
  g.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** Deterministic pseudo-random numbers, so a biome's scenery doesn't reshuffle every battle. */
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function skyDome(look: BiomeLook): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(60, 32, 16);
  const top = new THREE.Color(look.skyTop);
  const horizon = new THREE.Color(look.skyHorizon);
  const colors: number[] = [];
  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i++) {
    const y = position.getY(i) / 60;
    const t = Math.pow(Math.max(0, y), 0.55);
    const c = horizon.clone().lerp(top, t);
    colors.push(c.r, c.g, c.b);
  }
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  return new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false }));
}

/** Rolling ground with mottled colour, so it reads as grass or stone rather than a flat sheet. */
function terrain(look: BiomeLook, biome: Biome, random: () => number): THREE.Mesh {
  const geometry = new THREE.PlaneGeometry(40, 40, 80, 80);
  geometry.rotateX(-Math.PI / 2);
  const position = geometry.attributes.position;
  const palette = look.ground.map((c) => new THREE.Color(c));
  const colors: number[] = [];
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const z = position.getZ(i);
    const distance = Math.hypot(x, z + 1);
    // Flat where the fight is, rolling further out.
    const roll = biome === "water" ? 0 : Math.max(0, distance - 4) * 0.06;
    const height = roll * (Math.sin(x * 0.45) * Math.cos(z * 0.38) + Math.sin(x * 0.13 + z * 0.21) * 1.6);
    position.setY(i, height);
    const n = (Math.sin(x * 3.1) * Math.cos(z * 2.7) + Math.sin(x * 7.3 + z * 5.1) * 0.5 + random() * 0.9) / 2.4 + 0.5;
    const index = Math.max(0, Math.min(palette.length - 1, Math.floor(n * palette.length)));
    const c = palette[index].clone();
    c.multiplyScalar(0.92 + random() * 0.14);
    colors.push(c.r, c.g, c.b);
  }
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  const material =
    biome === "water"
      ? new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.12, metalness: 0.35, transparent: true, opacity: 0.95 })
      : new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0, flatShading: false });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.receiveShadow = true;
  mesh.userData.water = biome === "water";
  return mesh;
}

function platform(look: BiomeLook, biome: Biome): THREE.Group {
  const g = new THREE.Group();
  const topMat = new THREE.MeshStandardMaterial({ color: look.platform, roughness: biome === "water" ? 0.9 : 0.85, flatShading: biome !== "grass" });
  const rimMat = new THREE.MeshStandardMaterial({ color: look.platformRim, roughness: 0.95, flatShading: true });
  const top = new THREE.Mesh(new THREE.CylinderGeometry(1, 1.05, 0.12, 40), topMat);
  top.position.y = 0.0;
  top.receiveShadow = true;
  top.castShadow = true;
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(1.06, biome === "water" ? 1.3 : 1.12, biome === "water" ? 0.6 : 0.14, 16), rimMat);
  rim.position.y = biome === "water" ? -0.33 : -0.1;
  rim.receiveShadow = true;
  rim.castShadow = true;
  g.add(rim, top);
  g.position.y = -0.06;
  return g;
}

/** A carob or olive tree — the trees of the Maltese countryside. */
function tree(random: () => number): THREE.Group {
  const g = new THREE.Group();
  const bark = new THREE.MeshStandardMaterial({ color: "#6b4f35", roughness: 0.95 });
  const leaf = new THREE.MeshStandardMaterial({ color: random() > 0.5 ? "#4f7f3a" : "#5e8a44", roughness: 0.85, flatShading: true });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.12, 0.9, 7), bark);
  trunk.position.y = 0.45;
  trunk.rotation.z = (random() - 0.5) * 0.3;
  trunk.castShadow = true;
  g.add(trunk);
  for (let i = 0; i < 4; i++) {
    const blob = new THREE.Mesh(new THREE.IcosahedronGeometry(0.35 + random() * 0.2, 1), leaf);
    blob.position.set((random() - 0.5) * 0.6, 0.95 + random() * 0.35, (random() - 0.5) * 0.6);
    blob.castShadow = true;
    blob.receiveShadow = true;
    g.add(blob);
  }
  return g;
}

/** A length of Maltese dry-stone rubble wall. */
function rubbleWall(length: number, random: () => number): THREE.Group {
  const g = new THREE.Group();
  const stone = new THREE.MeshStandardMaterial({ color: "#c8b48a", roughness: 0.95, flatShading: true });
  for (let x = 0; x < length; x += 0.32) {
    for (let row = 0; row < 3; row++) {
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.17 + random() * 0.05, 0), stone);
      rock.position.set(x + (row % 2) * 0.15, 0.13 + row * 0.2, (random() - 0.5) * 0.08);
      rock.rotation.set(random() * 3, random() * 3, random() * 3);
      rock.castShadow = true;
      rock.receiveShadow = true;
      g.add(rock);
    }
  }
  return g;
}

function boulder(random: () => number, color = "#cdb99a"): THREE.Mesh {
  const rock = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.4 + random() * 0.5, 1),
    new THREE.MeshStandardMaterial({ color, roughness: 0.95, flatShading: true })
  );
  rock.scale.set(1, 0.6 + random() * 0.5, 1);
  rock.rotation.set(random(), random() * 3, random());
  rock.castShadow = true;
  rock.receiveShadow = true;
  return rock;
}

/** A prickly pear — the island's unofficial plant. */
function pricklyPear(random: () => number): THREE.Group {
  const g = new THREE.Group();
  const pad = new THREE.MeshStandardMaterial({ color: "#6f9a4a", roughness: 0.7 });
  const fruit = new THREE.MeshStandardMaterial({ color: "#d9573a", roughness: 0.5 });
  const place = (parent: THREE.Object3D, depth: number) => {
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 8), pad);
    p.scale.set(1, 1.3, 0.3);
    p.position.y = 0.26;
    p.castShadow = true;
    parent.add(p);
    if (random() > 0.5) {
      const f = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), fruit);
      f.position.set(0.1, 0.52, 0.03);
      parent.add(f);
    }
    if (depth > 0) {
      for (let i = 0; i < 2; i++) {
        const child = new THREE.Group();
        child.position.set((i - 0.5) * 0.25, 0.42, 0);
        child.rotation.set(0, random() * 1.5, (i - 0.5) * 0.8);
        parent.add(child);
        place(child, depth - 1);
      }
    }
  };
  place(g, 2);
  return g;
}

function scenery(biome: Biome, random: () => number): THREE.Group {
  const g = new THREE.Group();
  const scatter = (count: number, make: () => THREE.Object3D, minR: number, maxR: number, arc = [-2.6, 0.5]) => {
    for (let i = 0; i < count; i++) {
      const angle = arc[0] + random() * (arc[1] - arc[0]);
      const r = minR + random() * (maxR - minR);
      const object = make();
      object.position.set(Math.cos(angle) * r + 0.5, 0, Math.sin(angle) * r - 1);
      object.rotation.y = random() * Math.PI * 2;
      g.add(object);
    }
  };
  if (biome === "grass") {
    scatter(14, () => tree(random), 5.5, 14);
    for (let i = 0; i < 3; i++) {
      const wall = rubbleWall(3 + random() * 3, random);
      wall.position.set(-6 + i * 5 + random(), 0, -6 - random() * 3);
      wall.rotation.y = (random() - 0.5) * 0.6;
      g.add(wall);
    }
  } else if (biome === "rock") {
    scatter(12, () => boulder(random), 4.5, 13);
    scatter(4, () => tree(random), 7, 14);
    // A standing stone on the skyline — the temples are never far away on these islands.
    const stone = new THREE.MeshStandardMaterial({ color: "#d8c49a", roughness: 0.95, flatShading: true });
    const trilithon = new THREE.Group();
    for (const side of [-1, 1]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.5, 2.2, 0.5), stone);
      post.position.set(side * 0.75, 1.1, 0);
      post.castShadow = true;
      trilithon.add(post);
    }
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.45, 0.6), stone);
    lintel.position.y = 2.4;
    lintel.castShadow = true;
    trilithon.add(lintel);
    trilithon.position.set(-4.5, 0, -8);
    trilithon.rotation.y = 0.4;
    g.add(trilithon);
  } else if (biome === "sand") {
    scatter(9, () => pricklyPear(random), 4.5, 11);
    scatter(5, () => boulder(random, "#d9c49c"), 6, 12);
  } else {
    // Out on the water: a few rocks breaking the surface and a distant painted boat.
    scatter(8, () => boulder(random, "#b8a47e"), 5, 14);
    const hull = new THREE.Mesh(
      new THREE.SphereGeometry(0.6, 20, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: "#2f6fb5", roughness: 0.5 })
    );
    hull.scale.set(0.6, 0.6, 1.8);
    hull.position.set(5, 0.25, -10);
    hull.rotation.y = 0.5;
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.08, 20), new THREE.MeshStandardMaterial({ color: "#f0c94a" }));
    band.scale.set(1, 1, 3);
    band.position.set(5, 0.28, -10);
    band.rotation.y = 0.5;
    g.add(hull, band);
  }
  return g;
}

// ─── Scene ───────────────────────────────────────────────────────────────────────────────────

export function createBattleScene(biome: Biome, options: { reducedMotion?: boolean } = {}): BattleSceneApi {
  const look = LOOKS[biome] ?? LOOKS.grass;
  const random = seeded(biome.length * 7919 + 17);
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(look.skyHorizon, look.fog);
  scene.add(skyDome(look));

  const camera = new THREE.PerspectiveCamera(38, 16 / 9, 0.1, 120);
  // Framed so the player's creature stands lower left and the opponent upper right, clear of
  // the two name plates (checked by projecting both positions for phone and laptop shapes).
  const cameraHome = new THREE.Vector3(0.3, 1.9, 6.4);
  const lookAt = new THREE.Vector3(0.6, 0.9, -1);
  camera.position.copy(cameraHome);
  camera.lookAt(lookAt);

  // A warm late-afternoon sun from the side, a cool sky fill, and a touch of bounce off the ground.
  const hemi = new THREE.HemisphereLight(look.skyHorizon, look.ground[0], 0.9);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight("#fff1d6", 2.4);
  sun.position.set(-5, 8, 4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -6;
  sun.shadow.camera.right = 6;
  sun.shadow.camera.top = 6;
  sun.shadow.camera.bottom = -6;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 25;
  sun.shadow.bias = -0.0008;
  sun.shadow.normalBias = 0.02;
  sun.target.position.set(0.4, 0, -0.8);
  scene.add(sun, sun.target);

  const ground = terrain(look, biome, random);
  scene.add(ground);
  scene.add(scenery(biome, random));

  const playerPlatform = platform(look, biome);
  playerPlatform.position.x = PLAYER_POS.x;
  playerPlatform.position.z = PLAYER_POS.z;
  playerPlatform.scale.setScalar(1.05);
  const enemyPlatform = platform(look, biome);
  enemyPlatform.position.x = ENEMY_POS.x;
  enemyPlatform.position.z = ENEMY_POS.z;
  scene.add(playerPlatform, enemyPlatform);

  const glow = glowTexture();

  // ─── Creatures ─────────────────────────────────────────────────────────────────────────────

  interface Slot {
    model: CreatureModel | null;
    holder: THREE.Group;
    home: THREE.Vector3;
    baseScale: number;
    facing: number;
    toward: THREE.Vector3;
    sample: () => AnimSample;
  }
  const idle = (): AnimSample => ({ shakeX: 0, scale: 1, opacity: 1, hitFlash: 0, healFlash: 0 });
  const makeSlot = (home: THREE.Vector3, other: THREE.Vector3, baseScale: number, faceBlend: number): Slot => {
    const holder = new THREE.Group();
    holder.position.copy(home);
    scene.add(holder);
    const toward = other.clone().sub(home).setY(0).normalize();
    // Turn most of the way toward the opponent, but keep a little of the face to the camera.
    const facing = Math.atan2(toward.x, toward.z) * faceBlend;
    return { model: null, holder, home: home.clone(), baseScale, facing, toward, sample: idle };
  };
  const slots = {
    player: makeSlot(PLAYER_POS, ENEMY_POS, PLAYER_SCALE, 0.78),
    enemy: makeSlot(ENEMY_POS, PLAYER_POS, ENEMY_SCALE, 0.7),
  };

  function setCreature(side: "player" | "enemy", design: CreatureDesign) {
    const slot = slots[side];
    if (slot.model) {
      slot.holder.remove(slot.model.group);
      disposeModel(slot.model);
    }
    const model = buildCreatureModel(design);
    model.group.rotation.y = slot.facing;
    slot.holder.add(model.group);
    slot.model = model;
  }

  // ─── Effects ───────────────────────────────────────────────────────────────────────────────

  interface Particle {
    sprite: THREE.Sprite;
    velocity: THREE.Vector3;
    life: number;
    maxLife: number;
    size: number;
    gravity: number;
  }
  const particles: Particle[] = [];
  function spark(at: THREE.Vector3, color: string, options: { speed?: number; life?: number; size?: number; gravity?: number; up?: number } = {}) {
    const material = new THREE.SpriteMaterial({ map: glow, color, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true });
    const sprite = new THREE.Sprite(material);
    sprite.position.copy(at);
    const size = options.size ?? 0.18;
    sprite.scale.setScalar(size);
    scene.add(sprite);
    const speed = options.speed ?? 1.2;
    const velocity = new THREE.Vector3((Math.random() - 0.5) * speed, (Math.random() * 0.8 + (options.up ?? 0.2)) * speed, (Math.random() - 0.5) * speed);
    const life = options.life ?? 0.6;
    particles.push({ sprite, velocity, life, maxLife: life, size, gravity: options.gravity ?? 1.5 });
  }

  interface Flight {
    object: THREE.Object3D;
    light?: THREE.PointLight;
    from: THREE.Vector3;
    to: THREE.Vector3;
    arc: number;
    duration: number;
    elapsed: number;
    color: string;
    trail: boolean;
    spin: boolean;
    onLand?: () => void;
  }
  const flights: Flight[] = [];

  const aimPoint = (side: "player" | "enemy") => {
    const slot = slots[side];
    const height = (slot.model?.headHeight ?? 0.7) * slot.baseScale * 0.7;
    return slot.home.clone().add(new THREE.Vector3(0, height, 0));
  };

  function fireProjectile(type: TypeName, direction: "toEnemy" | "toPlayer", durationMs: number) {
    const color = TYPE_GLOW[type] ?? "#ffffff";
    const from = aimPoint(direction === "toEnemy" ? "player" : "enemy");
    const to = aimPoint(direction === "toEnemy" ? "enemy" : "player");
    const core = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    core.scale.setScalar(0.55);
    const inner = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: "#ffffff", blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    inner.scale.setScalar(0.5);
    core.add(inner);
    core.position.copy(from);
    const light = new THREE.PointLight(color, 3, 4, 2);
    core.add(light);
    scene.add(core);
    flights.push({
      object: core,
      light,
      from,
      to,
      arc: 0.7,
      duration: durationMs / 1000,
      elapsed: 0,
      color,
      trail: true,
      spin: false,
      onLand: () => {
        for (let i = 0; i < 18; i++) spark(to, color, { speed: 2.2, life: 0.5, size: 0.2 });
      },
    });
  }

  function throwBall(durationMs: number) {
    const ball = new THREE.Group();
    const top = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: "#c0392b", roughness: 0.35 })
    );
    const bottom = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 16, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: "#f4efe4", roughness: 0.35 })
    );
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.015, 6, 20), new THREE.MeshStandardMaterial({ color: "#2b2b2b" }));
    band.rotation.x = Math.PI / 2;
    ball.add(top, bottom, band);
    ball.traverse((o) => ((o as THREE.Mesh).castShadow = true));
    const from = slots.player.home.clone().add(new THREE.Vector3(0.3, 0.9, 0.2));
    const to = aimPoint("enemy");
    ball.position.copy(from);
    scene.add(ball);
    flights.push({
      object: ball,
      from,
      to,
      arc: 1.4,
      duration: durationMs / 1000,
      elapsed: 0,
      color: "#ffffff",
      trail: false,
      spin: true,
      onLand: () => {
        for (let i = 0; i < 14; i++) spark(to, "#fff3c0", { speed: 1.6, life: 0.45 });
      },
    });
  }

  const rings: { mesh: THREE.Mesh; t: number }[] = [];
  let flash = 0;
  const flashLight = new THREE.PointLight("#ffd66a", 0, 6, 2);
  scene.add(flashLight);

  function cruxBurst() {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.6, 0.05, 8, 48),
      new THREE.MeshBasicMaterial({ color: "#ffd24a", transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.copy(slots.player.home).add(new THREE.Vector3(0, 0.1, 0));
    scene.add(ring);
    rings.push({ mesh: ring, t: 0 });
    flashLight.position.copy(aimPoint("player"));
    flashLight.color.set("#ffd66a");
    flash = 1;
    for (let i = 0; i < 26; i++) spark(slots.player.home.clone().add(new THREE.Vector3(0, 0.2, 0)), "#ffd24a", { speed: 1.8, up: 0.8, life: 0.9, gravity: -0.4 });
  }

  function itemFlash(tint: string) {
    flashLight.position.copy(aimPoint("player"));
    flashLight.color.set(tint);
    flash = 0.7;
    for (let i = 0; i < 20; i++) {
      const at = slots.player.home.clone().add(new THREE.Vector3((Math.random() - 0.5) * 1.2, Math.random() * 0.8, (Math.random() - 0.5) * 1.2));
      spark(at, tint, { speed: 0.4, up: 1.5, life: 1.0, gravity: -0.6, size: 0.14 });
    }
  }

  // ─── Per frame ─────────────────────────────────────────────────────────────────────────────

  const red = new THREE.Color("#ff2a1a");
  const green = new THREE.Color("#5dff9a");
  const cameraRight = new THREE.Vector3();

  function frame(dt: number, time: number) {
    camera.getWorldDirection(cameraRight);
    cameraRight.cross(camera.up).normalize();

    for (const side of ["player", "enemy"] as const) {
      const slot = slots[side];
      const model = slot.model;
      if (!model) continue;
      const s = slot.sample();
      const phase = side === "player" ? 0 : 1.7;
      // Breathing, a bob for anything that flies or swims, and the shake/lunge from the battle.
      const bob = model.hovers ? 0.16 + Math.sin(time * 2.2 + phase) * 0.06 : 0;
      const breathe = 1 + Math.sin(time * 2.4 + phase) * 0.018;
      const offset = slot.toward.clone().multiplyScalar(s.shakeX * 0.022);
      slot.holder.position.set(slot.home.x + offset.x, slot.home.y + bob, slot.home.z + offset.z);
      const scale = slot.baseScale * s.scale;
      slot.holder.scale.set(scale, scale * breathe, scale);
      // Fainting sinks a little as it fades.
      slot.holder.position.y -= (1 - s.opacity) * 0.25;

      for (const part of model.swaying) {
        if (part.userData.spin) part.rotation.y += dt * 6;
        else if (part.userData.flap) part.rotation.z = Math.sin(time * (model.hovers ? 9 : 3) + phase) * 0.35 * part.userData.flap;
        else part.rotation.z = Math.sin(time * 1.8 + phase + part.id) * 0.12;
      }

      const tint = s.hitFlash > 0.01 ? red : s.healFlash > 0.01 ? green : null;
      const amount = Math.max(s.hitFlash, s.healFlash) * 2.2;
      for (const material of model.materials) {
        if (tint) {
          material.emissive.copy(material.userData.baseEmissive as THREE.Color).lerp(tint, Math.min(1, amount));
          material.emissiveIntensity = Math.max(material.userData.baseEmissiveIntensity as number, amount);
        } else if (material.emissiveIntensity !== material.userData.baseEmissiveIntensity) {
          material.emissive.copy(material.userData.baseEmissive as THREE.Color);
          material.emissiveIntensity = material.userData.baseEmissiveIntensity as number;
        }
        const baseOpacity = (material.userData.baseOpacity as number) ?? 1;
        const opacity = s.opacity * baseOpacity;
        if (material.opacity !== opacity) {
          material.opacity = opacity;
          const transparent = opacity < 0.999 || !!material.userData.alwaysTransparent;
          if (material.transparent !== transparent) {
            material.transparent = transparent;
            material.needsUpdate = true;
          }
        }
      }
    }

    for (let i = flights.length - 1; i >= 0; i--) {
      const f = flights[i];
      f.elapsed += dt;
      const t = Math.min(1, f.elapsed / f.duration);
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      f.object.position.lerpVectors(f.from, f.to, eased);
      f.object.position.y += Math.sin(t * Math.PI) * f.arc;
      if (f.spin) f.object.rotation.x += dt * 18;
      if (f.trail && Math.random() < 0.9) spark(f.object.position, f.color, { speed: 0.3, life: 0.35, size: 0.22, gravity: 0 });
      if (t >= 1) {
        f.onLand?.();
        scene.remove(f.object);
        f.object.traverse((o) => {
          const mesh = o as THREE.Mesh;
          mesh.geometry?.dispose();
          (mesh.material as THREE.Material | undefined)?.dispose?.();
        });
        f.light?.dispose();
        flights.splice(i, 1);
      }
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.velocity.y -= p.gravity * dt;
      p.sprite.position.addScaledVector(p.velocity, dt);
      const k = Math.max(0, p.life / p.maxLife);
      (p.sprite.material as THREE.SpriteMaterial).opacity = k;
      p.sprite.scale.setScalar(p.size * (0.5 + k * 0.7));
      if (p.life <= 0) {
        scene.remove(p.sprite);
        p.sprite.material.dispose();
        particles.splice(i, 1);
      }
    }

    for (let i = rings.length - 1; i >= 0; i--) {
      const r = rings[i];
      r.t += dt / 0.7;
      r.mesh.scale.setScalar(0.4 + r.t * 3);
      (r.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.9 * (1 - r.t));
      if (r.t >= 1) {
        scene.remove(r.mesh);
        r.mesh.geometry.dispose();
        (r.mesh.material as THREE.Material).dispose();
        rings.splice(i, 1);
      }
    }

    flash = Math.max(0, flash - dt * 1.6);
    flashLight.intensity = flash * 8;

    if (ground.userData.water) {
      // The sea moves.
      const position = (ground.geometry as THREE.BufferGeometry).attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < position.count; i += 1) {
        const x = position.getX(i);
        const z = position.getZ(i);
        position.setY(i, Math.sin(x * 0.9 + time * 1.2) * 0.05 + Math.cos(z * 1.1 + time * 0.9) * 0.05);
      }
      position.needsUpdate = true;
    }

    if (!options.reducedMotion) {
      // The camera breathes very slightly, like a hand-held shot.
      camera.position.set(cameraHome.x + Math.sin(time * 0.35) * 0.08, cameraHome.y + Math.sin(time * 0.5) * 0.04, cameraHome.z);
      camera.lookAt(lookAt);
    }
  }

  function resize(width: number, height: number) {
    camera.aspect = width / Math.max(1, height);
    // On a narrow stage pull back a little so both creatures stay in frame.
    camera.fov = camera.aspect < 1.8 ? 44 : 36;
    camera.updateProjectionMatrix();
  }

  function dispose() {
    for (const slot of Object.values(slots)) if (slot.model) disposeModel(slot.model);
    scene.traverse((object) => {
      const mesh = object as THREE.Mesh;
      mesh.geometry?.dispose();
      const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(material)) material.forEach((m) => m.dispose());
      else material?.dispose?.();
    });
    glow.dispose();
  }

  return {
    scene,
    camera,
    frame,
    resize,
    dispose,
    setCreature,
    setAnimSource: (side, sample) => {
      slots[side].sample = sample;
    },
    fireProjectile,
    throwBall,
    cruxBurst,
    itemFlash,
  };
}
