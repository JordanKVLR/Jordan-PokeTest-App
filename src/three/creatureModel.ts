import * as THREE from "three";
import type { CreatureDesign, EyeKind, PropKind } from "../art/creatureArt";

/**
 * Builds a creature as a real 3D model from the same design record the 2D art uses — body
 * archetype, colours, crest, tail, pattern, eyes and prop — so every species in the game has a
 * 3D form without anyone modelling a hundred creatures by hand.
 *
 * Conventions: the creature faces +Z, stands on y = 0, and the finished model is scaled to
 * about one unit tall. Every material it uses is listed in `userData.materials`, so the battle
 * scene can flash, tint and fade the whole creature at once.
 */

export interface CreatureModel {
  group: THREE.Group;
  /** Every material on the model, for hit/heal flashes and fainting. */
  materials: THREE.MeshStandardMaterial[];
  /** Where the eyes/head sit, in model space — projectiles aim here. */
  headHeight: number;
  /** Creatures that fly or swim hover and bob; the rest stand. */
  hovers: boolean;
  /** Parts that sway on their own in the idle animation. */
  swaying: THREE.Object3D[];
}

interface Kit {
  mats: THREE.MeshStandardMaterial[];
  mat: (color: string | number, options?: Partial<THREE.MeshStandardMaterialParameters>) => THREE.MeshStandardMaterial;
  add: (parent: THREE.Object3D, geometry: THREE.BufferGeometry, material: THREE.Material, position?: [number, number, number], scale?: [number, number, number] | number, rotation?: [number, number, number]) => THREE.Mesh;
  swaying: THREE.Object3D[];
}

const SEG = 24;

function makeKit(): Kit {
  const mats: THREE.MeshStandardMaterial[] = [];
  const cache = new Map<string, THREE.MeshStandardMaterial>();
  return {
    mats,
    swaying: [],
    mat(color, options = {}) {
      const key = `${color}|${JSON.stringify(options)}`;
      const cached = cache.get(key);
      if (cached) return cached;
      const material = new THREE.MeshStandardMaterial({ color, roughness: 0.62, metalness: 0.02, ...options });
      material.userData.baseEmissive = material.emissive.clone();
      material.userData.baseEmissiveIntensity = material.emissiveIntensity;
      material.userData.baseOpacity = material.opacity;
      material.userData.alwaysTransparent = material.transparent;
      mats.push(material);
      cache.set(key, material);
      return material;
    },
    add(parent, geometry, material, position = [0, 0, 0], scale = 1, rotation = [0, 0, 0]) {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(...position);
      if (typeof scale === "number") mesh.scale.setScalar(scale);
      else mesh.scale.set(...scale);
      mesh.rotation.set(...rotation);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      parent.add(mesh);
      return mesh;
    },
  };
}

const sphere = (r = 1, w = SEG, h = Math.round(SEG * 0.66)) => new THREE.SphereGeometry(r, w, h);
const capsule = (r: number, length: number) => new THREE.CapsuleGeometry(r, length, 8, 16);
const cone = (r: number, h: number, seg = 16) => new THREE.ConeGeometry(r, h, seg);
const cylinder = (rt: number, rb: number, h: number, seg = 16) => new THREE.CylinderGeometry(rt, rb, h, seg);
const box = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);

function shade(hex: string, factor: number): string {
  const c = new THREE.Color(hex);
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  c.setHSL(hsl.h, hsl.s, Math.max(0, Math.min(1, hsl.l * factor)));
  return `#${c.getHexString()}`;
}

/** A skeleton of named anchor points each body builder fills in, so crests, eyes and props land right. */
interface Anchors {
  head: THREE.Vector3;
  headRadius: number;
  /** The direction the face looks, usually +Z. */
  back: THREE.Vector3;
  tailBase: THREE.Vector3;
  chest: THREE.Vector3;
  torso: { center: THREE.Vector3; radius: number; length: number; axis: "x" | "y" | "z" };
  hand?: THREE.Vector3;
  hovers?: boolean;
}

// ─── Eyes ────────────────────────────────────────────────────────────────────────────────────

function addEyes(k: Kit, parent: THREE.Object3D, kind: EyeKind, head: THREE.Vector3, r: number, iris: string) {
  const spread = r * 0.42;
  const size = r * (kind === "wide" ? 0.3 : 0.24);
  const white = k.mat("#fbfbf6", { roughness: 0.25 });
  const glow = kind === "glow";
  const pupilMat = glow
    ? k.mat("#fff1a8", { emissive: new THREE.Color("#ffd94a"), emissiveIntensity: 1.4, roughness: 0.3 })
    : k.mat("#1d2328", { roughness: 0.15, metalness: 0.1 });
  for (const side of [-1, 1]) {
    const eye = new THREE.Group();
    eye.position.set(head.x + side * spread, head.y + r * 0.12, head.z + r * 0.82);
    parent.add(eye);
    if (!glow) k.add(eye, sphere(size, 16, 12), white);
    const pupil = k.add(eye, sphere(size * (glow ? 0.95 : 0.55), 14, 10), pupilMat, [0, 0, size * (glow ? 0.1 : 0.62)]);
    if (kind === "sleepy") eye.scale.set(1, 0.38, 1);
    if (kind === "fierce") {
      // A brow slanting down toward the middle.
      k.add(eye, box(size * 2.2, size * 0.45, size * 0.6), k.mat(iris), [0, size * 0.95, size * 0.3], 1, [0, 0, side * 0.45]);
    }
    if (!glow) {
      // A catch-light sells a living eye more than anything else at this size.
      k.add(eye, sphere(size * 0.18, 8, 6), k.mat("#ffffff", { emissive: new THREE.Color("#ffffff"), emissiveIntensity: 0.6 }), [
        size * 0.25,
        size * 0.3,
        size * 0.95,
      ]);
    }
    void pupil;
  }
}

// ─── Crests ──────────────────────────────────────────────────────────────────────────────────

function addCrest(k: Kit, parent: THREE.Object3D, design: CreatureDesign, a: Anchors) {
  const { head, headRadius: r } = a;
  const accent = design.secondary ?? shade(design.primary, 1.3);
  const horn = k.mat(shade(accent, 0.92), { roughness: 0.4 });
  switch (design.crest) {
    case "horn":
      k.add(parent, cone(r * 0.2, r * 0.9), horn, [head.x, head.y + r * 0.95, head.z + r * 0.35], 1, [0.35, 0, 0]);
      break;
    case "twinhorn":
      for (const side of [-1, 1]) {
        k.add(parent, cone(r * 0.17, r * 0.95), horn, [head.x + side * r * 0.5, head.y + r * 0.85, head.z + r * 0.1], 1, [0.1, 0, -side * 0.55]);
      }
      break;
    case "ears":
      for (const side of [-1, 1]) {
        const ear = k.add(parent, cone(r * 0.3, r * 0.75, 4), k.mat(design.primary), [head.x + side * r * 0.55, head.y + r * 0.85, head.z - r * 0.05], 1, [0, Math.PI / 4, -side * 0.35]);
        k.add(ear, cone(r * 0.18, r * 0.5, 4), k.mat(accent), [0, -r * 0.05, r * 0.06]);
      }
      break;
    case "plume": {
      const plume = new THREE.Group();
      plume.position.set(head.x, head.y + r * 0.8, head.z - r * 0.1);
      parent.add(plume);
      [-0.35, 0, 0.35].forEach((tilt, i) => {
        k.add(plume, sphere(r * 0.2, 12, 8), k.mat(i === 1 ? accent : shade(design.primary, 1.15)), [0, r * 0.35, -r * 0.1], [0.7, 2.4, 0.7], [tilt - 0.4, 0, tilt]);
      });
      k.swaying.push(plume);
      break;
    }
    case "fin":
      k.add(parent, cylinder(r * 0.9, r * 0.9, r * 0.08, 20), k.mat(accent, { transparent: true, opacity: 0.92 }), [a.back.x, a.back.y + r * 0.35, a.back.z], [1, 1, 0.6], [0, 0, Math.PI / 2]);
      break;
    case "antennae":
      for (const side of [-1, 1]) {
        const stalk = k.add(parent, cylinder(r * 0.03, r * 0.04, r * 0.9, 6), k.mat(shade(design.primary, 0.6)), [head.x + side * r * 0.3, head.y + r * 1.15, head.z + r * 0.2], 1, [0.4, 0, -side * 0.35]);
        k.add(stalk, sphere(r * 0.1, 10, 8), k.mat(accent), [0, r * 0.47, 0]);
        k.swaying.push(stalk);
      }
      break;
    default:
      break;
  }
}

// ─── Tails ───────────────────────────────────────────────────────────────────────────────────

function addTail(k: Kit, parent: THREE.Object3D, design: CreatureDesign, a: Anchors) {
  const base = a.tailBase;
  const accent = design.secondary ?? shade(design.primary, 1.3);
  const holder = new THREE.Group();
  holder.position.copy(base);
  parent.add(holder);
  const s = a.torso.radius;
  switch (design.tail) {
    case "stub":
      k.add(holder, sphere(s * 0.35, 12, 8), k.mat(design.primary));
      break;
    case "long":
    case "leaf":
    case "flame": {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, s * 0.5, -s * 0.9),
        new THREE.Vector3(0, s * 1.5, -s * 1.3),
        new THREE.Vector3(0, s * 2.2, -s * 1.0),
      ]);
      k.add(holder, new THREE.TubeGeometry(curve, 20, s * 0.12, 8, false), k.mat(design.primary));
      const tip = curve.getPoint(1);
      if (design.tail === "leaf") {
        k.add(holder, sphere(s * 0.35, 14, 10), k.mat("#6fb24a", { roughness: 0.5 }), [tip.x, tip.y + s * 0.2, tip.z], [0.55, 1.3, 0.2], [0.3, 0, 0]);
      } else if (design.tail === "flame") {
        const flame = k.add(holder, cone(s * 0.3, s * 0.9, 12), k.mat("#ffb347", { emissive: new THREE.Color("#ff7a1a"), emissiveIntensity: 1.3, roughness: 0.4 }), [tip.x, tip.y + s * 0.4, tip.z]);
        k.add(flame, cone(s * 0.16, s * 0.5, 10), k.mat("#fff2b0", { emissive: new THREE.Color("#ffd24a"), emissiveIntensity: 1.6 }), [0, -s * 0.1, 0]);
        k.swaying.push(flame);
      }
      k.swaying.push(holder);
      break;
    }
    case "fan":
      for (let i = -2; i <= 2; i++) {
        k.add(holder, sphere(s * 0.2, 10, 8), k.mat(i % 2 === 0 ? design.primary : accent), [i * s * 0.12, s * 0.35, -s * 0.35], [0.5, 2.2, 0.25], [-0.6, 0, i * 0.3]);
      }
      k.swaying.push(holder);
      break;
    default:
      break;
  }
}

// ─── Patterns ────────────────────────────────────────────────────────────────────────────────

function addPattern(k: Kit, parent: THREE.Object3D, design: CreatureDesign, a: Anchors) {
  const { center, radius: r, length, axis } = a.torso;
  const dark = k.mat(shade(design.primary, 0.72));
  const accent = k.mat(design.secondary ?? shade(design.primary, 1.3));
  const along = (t: number) => {
    const p = center.clone();
    if (axis === "z") p.z += t * length * 0.5;
    else if (axis === "x") p.x += t * length * 0.5;
    else p.y += t * length * 0.5;
    return p;
  };
  const ringRotation: [number, number, number] = axis === "z" ? [0, 0, 0] : axis === "x" ? [0, Math.PI / 2, 0] : [Math.PI / 2, 0, 0];
  // Rings only sit right on the tube-shaped bodies; on round or flattened ones they read as
  // hoops floating around the creature, so those bodies get spots instead.
  const ringsFit = ["quadruped", "feline", "biped", "insect"].includes(design.body);
  const spotsFit = ["avian", "golem", "blob"].includes(design.body);
  const pattern =
    !ringsFit && (design.pattern === "stripes" || design.pattern === "waves") ? (spotsFit ? "spots" : "none") : design.pattern;
  switch (pattern) {
    case "stripes":
      [-0.5, 0, 0.5].forEach((t) => k.add(parent, new THREE.TorusGeometry(r * 1.0, r * 0.07, 8, 28), dark, along(t).toArray() as [number, number, number], 1, ringRotation));
      break;
    case "waves":
      [-0.35, 0.35].forEach((t) => k.add(parent, new THREE.TorusGeometry(r * 1.0, r * 0.05, 8, 28), accent, along(t).toArray() as [number, number, number], 1, ringRotation));
      break;
    case "spots":
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 1.4 - 0.2;
        const t = (i % 3) / 2 - 0.5;
        const p = along(t);
        p.x += Math.cos(angle) * r * 0.95;
        p.y += Math.abs(Math.sin(angle)) * r * 0.95;
        k.add(parent, sphere(r * 0.14, 10, 8), dark, p.toArray() as [number, number, number], [1, 0.5, 1]);
      }
      break;
    case "plates":
      for (let i = 0; i < 4; i++) {
        const p = along(i / 3 - 0.5);
        p.y += r * 0.95;
        k.add(parent, box(r * 0.55, r * 0.14, r * 0.35), k.mat(shade(design.primary, 0.85), { roughness: 0.85, flatShading: true }), p.toArray() as [number, number, number], 1, [0.2, 0, 0]);
      }
      break;
    case "mosaic": {
      const tiles = ["#b1633f", "#e8dcc0", "#3f7fae", "#d9b25a"];
      for (let i = 0; i < 9; i++) {
        const p = center.clone();
        p.x += ((i % 3) - 1) * r * 0.4;
        p.y += Math.floor(i / 3) * r * 0.32 - r * 0.2;
        p.z += r * 0.93;
        k.add(parent, box(r * 0.3, r * 0.26, r * 0.08), k.mat(tiles[i % tiles.length], { roughness: 0.35 }), p.toArray() as [number, number, number]);
      }
      break;
    }
    default:
      break;
  }
}

// ─── Props ───────────────────────────────────────────────────────────────────────────────────

function addProp(k: Kit, parent: THREE.Object3D, prop: PropKind, color: string, a: Anchors) {
  const { head, headRadius: r, back, chest } = a;
  const m = k.mat(color, { roughness: 0.7 });
  const metal = k.mat(color, { roughness: 0.28, metalness: 0.85 });
  switch (prop) {
    case "megalith": {
      // A trilithon — two uprights and a lintel — carried on the back.
      const g = new THREE.Group();
      g.position.copy(back).add(new THREE.Vector3(0, r * 0.2, 0));
      parent.add(g);
      const stone = k.mat(color, { roughness: 0.95, flatShading: true });
      for (const side of [-1, 1]) k.add(g, box(r * 0.3, r * 1.1, r * 0.3), stone, [side * r * 0.4, r * 0.55, 0]);
      k.add(g, box(r * 1.25, r * 0.28, r * 0.36), stone, [0, r * 1.2, 0]);
      break;
    }
    case "lantern": {
      const hand = a.hand ?? chest;
      const g = new THREE.Group();
      g.position.copy(hand);
      parent.add(g);
      k.add(g, cylinder(r * 0.02, r * 0.02, r * 0.4, 6), k.mat("#3b3b3b", { metalness: 0.6, roughness: 0.4 }), [0, r * 0.2, 0]);
      k.add(g, box(r * 0.32, r * 0.4, r * 0.32), k.mat("#ffe7a0", { emissive: new THREE.Color(color), emissiveIntensity: 1.5, transparent: true, opacity: 0.9 }), [0, -r * 0.1, 0]);
      k.swaying.push(g);
      break;
    }
    case "knightHelm": {
      const g = new THREE.Group();
      g.position.copy(head);
      parent.add(g);
      k.add(g, sphere(r * 1.08, 20, 14, ), metal, [0, r * 0.12, 0], [1, 0.95, 1]);
      k.add(g, box(r * 1.3, r * 0.1, r * 0.12), k.mat("#20262b"), [0, r * 0.05, r * 1.02]);
      k.add(g, cone(r * 0.15, r * 0.7, 10), k.mat("#c0392b"), [0, r * 1.25, -r * 0.1]);
      break;
    }
    case "malteseCross": {
      const g = new THREE.Group();
      g.position.copy(chest).add(new THREE.Vector3(0, 0, r * 0.1));
      parent.add(g);
      const white = k.mat(color, { roughness: 0.4 });
      for (let i = 0; i < 4; i++) {
        const arm = k.add(g, cone(r * 0.2, r * 0.35, 3), white, [0, 0, 0], 1, [0, 0, (i * Math.PI) / 2]);
        arm.translateY(r * 0.17);
        arm.scale.z = 0.25;
      }
      break;
    }
    case "crescent":
      k.add(parent, new THREE.TorusGeometry(r * 0.45, r * 0.08, 8, 24, Math.PI * 1.3), k.mat(color, { emissive: new THREE.Color(color), emissiveIntensity: 0.6 }), [head.x, head.y + r * 1.25, head.z], 1, [0, 0, -0.9]);
      break;
    case "turban":
      k.add(parent, new THREE.TorusGeometry(r * 0.72, r * 0.3, 12, 24), m, [head.x, head.y + r * 0.62, head.z], 1, [Math.PI / 2, 0, 0]);
      k.add(parent, sphere(r * 0.5, 16, 10), m, [head.x, head.y + r * 0.8, head.z], [1, 0.7, 1]);
      break;
    case "cannon": {
      const g = new THREE.Group();
      g.position.copy(back).add(new THREE.Vector3(0, r * 0.25, 0));
      parent.add(g);
      k.add(g, cylinder(r * 0.22, r * 0.3, r * 1.4, 16), metal, [0, 0, r * 0.2], 1, [Math.PI / 2 - 0.3, 0, 0]);
      break;
    }
    case "sail": {
      const g = new THREE.Group();
      g.position.copy(back);
      parent.add(g);
      k.add(g, cylinder(r * 0.04, r * 0.05, r * 2.2, 8), k.mat("#6b4f33"), [0, r * 1.1, 0]);
      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.lineTo(0, r * 1.8);
      shape.lineTo(r * 1.1, r * 0.2);
      shape.lineTo(0, 0);
      const sail = k.add(g, new THREE.ShapeGeometry(shape), k.mat(color, { side: THREE.DoubleSide, roughness: 0.9 }), [r * 0.05, r * 0.2, 0], 1, [0, Math.PI / 2, 0]);
      k.swaying.push(sail);
      break;
    }
    case "propeller": {
      const g = new THREE.Group();
      g.position.set(head.x, head.y + r * 1.1, head.z);
      parent.add(g);
      k.add(g, cylinder(r * 0.05, r * 0.05, r * 0.3, 8), metal);
      const blades = new THREE.Group();
      blades.position.y = r * 0.16;
      g.add(blades);
      for (let i = 0; i < 3; i++) k.add(blades, box(r * 0.9, r * 0.03, r * 0.16), metal, [0, 0, 0], 1, [0, (i * Math.PI * 2) / 3, 0]).translateX(r * 0.4);
      blades.userData.spin = true;
      k.swaying.push(blades);
      break;
    }
    case "spiralShell": {
      const g = new THREE.Group();
      g.position.copy(back).add(new THREE.Vector3(0, r * 0.3, 0));
      parent.add(g);
      for (let i = 0; i < 4; i++) {
        k.add(g, new THREE.TorusGeometry(r * (0.75 - i * 0.16), r * (0.28 - i * 0.05), 12, 24), k.mat(i % 2 ? shade(color, 1.25) : color, { roughness: 0.35 }), [0, i * r * 0.28, 0], 1, [Math.PI / 2, 0, 0]);
      }
      break;
    }
    case "eyeOfOsiris": {
      const g = new THREE.Group();
      g.position.copy(chest).add(new THREE.Vector3(0, 0, r * 0.08));
      parent.add(g);
      k.add(g, cylinder(r * 0.42, r * 0.42, r * 0.06, 24), k.mat(color, { roughness: 0.4 }), [0, 0, 0], 1, [Math.PI / 2, 0, 0]);
      k.add(g, sphere(r * 0.22, 14, 10), k.mat("#fbfbf6"), [0, 0, r * 0.04], [1.5, 0.8, 0.4]);
      k.add(g, sphere(r * 0.11, 12, 8), k.mat("#1d2328"), [0, 0, r * 0.1]);
      break;
    }
    case "laurel":
      k.add(parent, new THREE.TorusGeometry(r * 0.78, r * 0.09, 8, 24), k.mat(color, { roughness: 0.55 }), [head.x, head.y + r * 0.5, head.z], 1, [Math.PI / 2 - 0.2, 0, 0]);
      for (let i = 0; i < 10; i++) {
        const angle = (i / 10) * Math.PI * 2;
        k.add(parent, sphere(r * 0.12, 8, 6), k.mat(shade(color, 1.15)), [head.x + Math.cos(angle) * r * 0.78, head.y + r * 0.52, head.z + Math.sin(angle) * r * 0.78], [1, 0.45, 1.8], [0, -angle, 0]);
      }
      break;
    case "amphora": {
      const points = [
        [0.0, 0], [0.22, 0.02], [0.3, 0.2], [0.33, 0.45], [0.24, 0.72], [0.12, 0.82], [0.13, 0.95], [0.16, 1.0],
      ].map(([x, y]) => new THREE.Vector2(x * r * 1.4, y * r * 1.4));
      const g = new THREE.Group();
      g.position.copy(back).add(new THREE.Vector3(0, r * 0.1, 0));
      parent.add(g);
      k.add(g, new THREE.LatheGeometry(points, 20), k.mat(color, { roughness: 0.8 }));
      break;
    }
    case "mosaicCrown":
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        k.add(parent, box(r * 0.22, r * 0.35, r * 0.1), k.mat(i % 2 ? color : "#e8dcc0", { roughness: 0.35 }), [head.x + Math.cos(angle) * r * 0.65, head.y + r * 0.85, head.z + Math.sin(angle) * r * 0.65], 1, [0, -angle + Math.PI / 2, 0]);
      }
      break;
    case "honeycomb": {
      const g = new THREE.Group();
      g.position.copy(back).add(new THREE.Vector3(0, r * 0.25, 0));
      parent.add(g);
      const wax = k.mat(color, { roughness: 0.3, emissive: new THREE.Color(color), emissiveIntensity: 0.15 });
      for (let i = 0; i < 5; i++) {
        k.add(g, cylinder(r * 0.2, r * 0.2, r * 0.25, 6), wax, [((i % 3) - 1) * r * 0.36, Math.floor(i / 3) * r * 0.3, 0], 1, [Math.PI / 2, 0, 0]);
      }
      break;
    }
    case "citrus":
      for (let i = 0; i < 3; i++) {
        k.add(parent, sphere(r * 0.28, 16, 12), k.mat(color, { roughness: 0.45 }), [head.x + (i - 1) * r * 0.45, head.y + r * 0.95 + (i === 1 ? r * 0.2 : 0), head.z - r * 0.1]);
      }
      break;
    case "waterwheel": {
      const g = new THREE.Group();
      g.position.copy(back).add(new THREE.Vector3(0, r * 0.3, 0));
      parent.add(g);
      const wood = k.mat(color, { roughness: 0.85 });
      const wheel = new THREE.Group();
      g.add(wheel);
      k.add(wheel, new THREE.TorusGeometry(r * 0.7, r * 0.07, 8, 28), wood);
      for (let i = 0; i < 6; i++) k.add(wheel, box(r * 1.4, r * 0.08, r * 0.18), wood, [0, 0, 0], 1, [0, 0, (i * Math.PI) / 6]);
      wheel.rotation.y = Math.PI / 2;
      wheel.userData.spin = true;
      k.swaying.push(wheel);
      break;
    }
    default:
      break;
  }
}

// ─── Bodies ──────────────────────────────────────────────────────────────────────────────────

type BodyBuilder = (k: Kit, g: THREE.Group, design: CreatureDesign) => Anchors;

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

const BODIES: Record<CreatureDesign["body"], BodyBuilder> = {
  quadruped(k, g, d) {
    const skin = k.mat(d.primary);
    const belly = k.mat(d.secondary ?? shade(d.primary, 1.3));
    k.add(g, capsule(0.3, 0.55), skin, [0, 0.62, 0], 1, [Math.PI / 2, 0, 0]);
    k.add(g, sphere(0.26), belly, [0, 0.5, 0.08], [0.9, 0.7, 1.35]);
    for (const [x, z] of [[-0.17, 0.3], [0.17, 0.3], [-0.17, -0.3], [0.17, -0.3]]) {
      k.add(g, capsule(0.085, 0.3), skin, [x, 0.25, z]);
      k.add(g, sphere(0.1, 12, 8), k.mat(shade(d.primary, 0.7)), [x, 0.05, z + 0.02], [1, 0.55, 1.2]);
    }
    const head = v(0, 0.95, 0.5);
    k.add(g, sphere(0.27), skin, head.toArray() as [number, number, number]);
    k.add(g, sphere(0.15), belly, [0, 0.88, 0.72], [1, 0.8, 1]);
    k.add(g, sphere(0.04, 10, 8), k.mat("#2a2024"), [0, 0.92, 0.86]);
    return { head, headRadius: 0.27, back: v(0, 0.95, -0.05), tailBase: v(0, 0.7, -0.52), chest: v(0, 0.7, 0.4), torso: { center: v(0, 0.62, 0), radius: 0.3, length: 0.55, axis: "z" } };
  },
  feline(k, g, d) {
    const skin = k.mat(d.primary);
    const belly = k.mat(d.secondary ?? shade(d.primary, 1.3));
    k.add(g, capsule(0.24, 0.55), skin, [0, 0.62, 0], 1, [Math.PI / 2, 0, 0]);
    k.add(g, sphere(0.2), belly, [0, 0.52, 0.12], [0.9, 0.7, 1.4]);
    for (const [x, z] of [[-0.14, 0.28], [0.14, 0.28], [-0.14, -0.28], [0.14, -0.28]]) {
      k.add(g, capsule(0.07, 0.38), skin, [x, 0.26, z]);
      k.add(g, sphere(0.085, 12, 8), belly, [x, 0.05, z + 0.03], [1, 0.55, 1.3]);
    }
    const head = v(0, 1.0, 0.42);
    k.add(g, sphere(0.28), skin, head.toArray() as [number, number, number]);
    k.add(g, sphere(0.13), belly, [0, 0.92, 0.64], [1.2, 0.8, 0.9]);
    k.add(g, sphere(0.035, 10, 8), k.mat("#2a2024"), [0, 0.97, 0.74]);
    return { head, headRadius: 0.28, back: v(0, 0.9, -0.05), tailBase: v(0, 0.68, -0.5), chest: v(0, 0.72, 0.36), torso: { center: v(0, 0.62, 0), radius: 0.24, length: 0.55, axis: "z" } };
  },
  biped(k, g, d) {
    const skin = k.mat(d.primary);
    const belly = k.mat(d.secondary ?? shade(d.primary, 1.3));
    k.add(g, capsule(0.28, 0.38), skin, [0, 0.72, 0]);
    k.add(g, sphere(0.22), belly, [0, 0.7, 0.14], [1, 1.25, 0.7]);
    for (const side of [-1, 1]) {
      k.add(g, capsule(0.1, 0.3), skin, [side * 0.15, 0.22, 0]);
      k.add(g, sphere(0.11, 12, 8), k.mat(shade(d.primary, 0.7)), [side * 0.15, 0.05, 0.05], [1, 0.5, 1.4]);
      k.add(g, capsule(0.08, 0.32), skin, [side * 0.36, 0.72, 0.05], 1, [0.2, 0, side * 0.35]);
    }
    const head = v(0, 1.28, 0.02);
    k.add(g, sphere(0.27), skin, head.toArray() as [number, number, number]);
    k.add(g, sphere(0.14), belly, [0, 1.2, 0.2], [1.1, 0.75, 0.8]);
    return { head, headRadius: 0.27, back: v(0, 0.95, -0.28), tailBase: v(0, 0.55, -0.26), chest: v(0, 0.85, 0.27), torso: { center: v(0, 0.72, 0), radius: 0.28, length: 0.38, axis: "y" }, hand: v(0.45, 0.55, 0.12) };
  },
  serpent(k, g, d) {
    const skin = k.mat(d.primary);
    const belly = k.mat(d.secondary ?? shade(d.primary, 1.3));
    // A coil rising into a raised head.
    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= 24; i++) {
      const t = i / 24;
      const angle = t * Math.PI * 3.2;
      const radius = 0.38 * (1 - t * 0.55);
      points.push(v(Math.cos(angle) * radius, 0.12 + t * 0.75, Math.sin(angle) * radius - 0.05));
    }
    const curve = new THREE.CatmullRomCurve3(points);
    k.add(g, new THREE.TubeGeometry(curve, 64, 0.12, 12, false), skin);
    const top = curve.getPoint(1);
    const head = v(top.x * 0.3, top.y + 0.18, 0.18);
    k.add(g, sphere(0.2), skin, head.toArray() as [number, number, number], [1, 0.85, 1.25]);
    k.add(g, sphere(0.12), belly, [head.x, head.y - 0.06, head.z + 0.14], [1, 0.6, 1]);
    k.add(g, sphere(0.3), belly, [0, 0.08, 0], [1.2, 0.25, 1.2]);
    return { head, headRadius: 0.2, back: v(0, 0.55, -0.2), tailBase: v(0.3, 0.12, -0.2), chest: v(0, 0.6, 0.2), torso: { center: v(0, 0.45, 0), radius: 0.14, length: 0.6, axis: "y" } };
  },
  avian(k, g, d) {
    const skin = k.mat(d.primary);
    const belly = k.mat(d.secondary ?? shade(d.primary, 1.3));
    const beakMat = k.mat("#f0a93a", { roughness: 0.4 });
    k.add(g, sphere(0.34), skin, [0, 0.62, 0], [1, 0.95, 1.2]);
    k.add(g, sphere(0.26), belly, [0, 0.57, 0.15], [1, 1.05, 0.8]);
    const head = v(0, 1.02, 0.18);
    k.add(g, sphere(0.22), skin, head.toArray() as [number, number, number]);
    k.add(g, cone(0.07, 0.2, 10), beakMat, [0, 0.98, 0.45], 1, [Math.PI / 2, 0, 0]);
    for (const side of [-1, 1]) {
      const wing = new THREE.Group();
      wing.position.set(side * 0.3, 0.7, -0.02);
      g.add(wing);
      k.add(wing, sphere(0.2, 16, 12), k.mat(shade(d.primary, 0.85)), [side * 0.12, 0, -0.05], [0.35, 1.0, 1.4], [0.2, 0, side * 0.5]);
      wing.userData.flap = side;
      k.swaying.push(wing);
      k.add(g, cylinder(0.025, 0.025, 0.28, 6), beakMat, [side * 0.1, 0.15, 0.02]);
      k.add(g, sphere(0.05, 8, 6), beakMat, [side * 0.1, 0.02, 0.07], [1, 0.4, 1.8]);
    }
    return { head, headRadius: 0.22, back: v(0, 0.95, -0.1), tailBase: v(0, 0.55, -0.38), chest: v(0, 0.7, 0.32), torso: { center: v(0, 0.62, 0), radius: 0.34, length: 0.5, axis: "z" } };
  },
  golem(k, g, d) {
    const stone = k.mat(d.primary, { roughness: 0.92, flatShading: true });
    const lightStone = k.mat(d.secondary ?? shade(d.primary, 1.2), { roughness: 0.9, flatShading: true });
    const chunk = (r: number) => new THREE.DodecahedronGeometry(r, 0);
    k.add(g, chunk(0.42), stone, [0, 0.78, 0], [1, 1.05, 0.8]);
    k.add(g, chunk(0.25), lightStone, [0, 0.75, 0.2], [1, 1.1, 0.5]);
    for (const side of [-1, 1]) {
      k.add(g, chunk(0.18), stone, [side * 0.2, 0.2, 0]);
      k.add(g, chunk(0.2), stone, [side * 0.5, 0.75, 0.05]);
      k.add(g, chunk(0.16), stone, [side * 0.56, 0.45, 0.1]);
    }
    const head = v(0, 1.32, 0.05);
    k.add(g, chunk(0.25), stone, head.toArray() as [number, number, number], [1, 0.9, 1]);
    return { head, headRadius: 0.25, back: v(0, 1.05, -0.3), tailBase: v(0, 0.5, -0.3), chest: v(0, 0.85, 0.3), torso: { center: v(0, 0.78, 0), radius: 0.4, length: 0.4, axis: "y" }, hand: v(0.6, 0.35, 0.15) };
  },
  blob(k, g, d) {
    const skin = k.mat(d.primary, { roughness: 0.35 });
    k.add(g, sphere(0.46, 32, 24), skin, [0, 0.42, 0], [1, 0.9, 1]);
    k.add(g, sphere(0.3), k.mat(d.secondary ?? shade(d.primary, 1.3), { roughness: 0.35 }), [0, 0.35, 0.22], [1, 0.85, 0.6]);
    for (const side of [-1, 1]) k.add(g, sphere(0.1, 12, 8), skin, [side * 0.22, 0.05, 0.15], [1, 0.5, 1.2]);
    const head = v(0, 0.55, 0.1);
    return { head, headRadius: 0.38, back: v(0, 0.8, -0.1), tailBase: v(0, 0.3, -0.42), chest: v(0, 0.4, 0.44), torso: { center: v(0, 0.42, 0), radius: 0.46, length: 0.2, axis: "y" } };
  },
  mollusc(k, g, d) {
    const skin = k.mat(d.secondary ?? shade(d.primary, 1.3), { roughness: 0.3 });
    const shell = k.mat(d.primary, { roughness: 0.4 });
    k.add(g, capsule(0.18, 0.55), skin, [0, 0.16, 0.05], [1, 0.7, 1], [Math.PI / 2, 0, 0]);
    for (let i = 0; i < 4; i++) {
      // Turned three-quarters so the spiral shows from the front as well as the side.
      k.add(g, new THREE.TorusGeometry(0.34 - i * 0.075, 0.13 - i * 0.022, 12, 28), i % 2 ? k.mat(shade(d.primary, 1.2), { roughness: 0.4 }) : shell, [i * 0.035, 0.46 + i * 0.03, -0.12 + i * 0.02], 1, [0, Math.PI / 2 - 0.75, 0]);
    }
    const head = v(0, 0.36, 0.4);
    for (const side of [-1, 1]) {
      const stalk = k.add(g, cylinder(0.02, 0.03, 0.3, 6), skin, [side * 0.08, 0.45, 0.4], 1, [0.3, 0, -side * 0.25]);
      k.swaying.push(stalk);
    }
    return { head, headRadius: 0.18, back: v(0, 0.75, -0.1), tailBase: v(0, 0.12, -0.4), chest: v(0, 0.3, 0.36), torso: { center: v(0, 0.46, -0.1), radius: 0.34, length: 0.2, axis: "x" } };
  },
  insect(k, g, d) {
    const skin = k.mat(d.primary, { roughness: 0.3 });
    const dark = k.mat(shade(d.primary, 0.45), { roughness: 0.4 });
    k.add(g, sphere(0.3), skin, [0, 0.55, -0.3], [0.9, 0.85, 1.25]);
    k.add(g, sphere(0.2), skin, [0, 0.62, 0.08]);
    const head = v(0, 0.75, 0.34);
    k.add(g, sphere(0.19), skin, head.toArray() as [number, number, number]);
    for (let i = 0; i < 3; i++) {
      for (const side of [-1, 1]) {
        const leg = new THREE.Group();
        leg.position.set(side * 0.15, 0.55, 0.12 - i * 0.14);
        g.add(leg);
        k.add(leg, cylinder(0.02, 0.02, 0.4, 6), dark, [side * 0.12, -0.18, 0], 1, [0, 0, side * 0.7]);
        k.add(leg, cylinder(0.018, 0.012, 0.32, 6), dark, [side * 0.26, -0.42, 0], 1, [0, 0, -side * 0.15]);
      }
    }
    for (const side of [-1, 1]) {
      const wing = new THREE.Group();
      wing.position.set(side * 0.12, 0.8, -0.02);
      g.add(wing);
      k.add(wing, sphere(0.28, 16, 8), k.mat("#e8f6ff", { transparent: true, opacity: 0.45, roughness: 0.05, metalness: 0.2, side: THREE.DoubleSide }), [side * 0.22, 0.12, -0.18], [1, 0.08, 0.55], [0, side * 0.3, side * 0.35]);
      wing.userData.flap = side;
      k.swaying.push(wing);
    }
    return { head, headRadius: 0.19, back: v(0, 0.9, -0.3), tailBase: v(0, 0.5, -0.65), chest: v(0, 0.62, 0.26), torso: { center: v(0, 0.55, -0.3), radius: 0.28, length: 0.6, axis: "z" } };
  },
  aquatic(k, g, d) {
    const skin = k.mat(d.primary, { roughness: 0.25, metalness: 0.15 });
    const belly = k.mat(d.secondary ?? shade(d.primary, 1.3), { roughness: 0.3 });
    k.add(g, sphere(0.32, 28, 20), skin, [0, 0.55, 0], [0.75, 0.9, 1.45]);
    k.add(g, sphere(0.26), belly, [0, 0.45, 0.05], [0.7, 0.6, 1.3]);
    const fin = k.mat(shade(d.primary, 0.85), { transparent: true, opacity: 0.9, side: THREE.DoubleSide });
    const tail = new THREE.Group();
    tail.position.set(0, 0.55, -0.45);
    g.add(tail);
    k.add(tail, cone(0.24, 0.38, 3), fin, [0, 0, -0.12], [0.25, 1, 1], [-Math.PI / 2, 0, 0]);
    k.swaying.push(tail);
    k.add(g, cone(0.14, 0.3, 3), fin, [0, 0.86, -0.05], [0.25, 1, 1.4]);
    for (const side of [-1, 1]) k.add(g, cone(0.08, 0.2, 3), fin, [side * 0.24, 0.45, 0.1], [0.3, 1, 1], [0.6, 0, side * 1.2]);
    const head = v(0, 0.6, 0.3);
    return { head, headRadius: 0.24, back: v(0, 0.85, -0.05), tailBase: v(0, 0.55, -0.45), chest: v(0, 0.48, 0.38), torso: { center: v(0, 0.55, 0), radius: 0.3, length: 0.7, axis: "z" }, hovers: true };
  },
  vessel(k, g, d) {
    const hull = k.mat(d.primary, { roughness: 0.55 });
    const trim = k.mat(d.secondary ?? shade(d.primary, 1.3), { roughness: 0.5 });
    // A luzzu: a deep hull swept up into a tall prow at the front and a stern post behind.
    const hullGeometry = new THREE.SphereGeometry(0.4, 28, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
    k.add(g, hullGeometry, hull, [0, 0.45, 0], [0.7, 0.85, 1.35]);
    k.add(g, cylinder(0.28, 0.28, 0.05, 28), trim, [0, 0.45, 0], [1, 1, 1.9]);
    // Prow and stern: tall painted posts, the luzzu's signature silhouette.
    k.add(g, cone(0.1, 0.5, 4), hull, [0, 0.6, 0.5], [1, 1, 0.8], [-0.35, Math.PI / 4, 0]);
    k.add(g, cone(0.08, 0.4, 4), hull, [0, 0.58, -0.5], [1, 1, 0.8], [0.35, Math.PI / 4, 0]);
    k.add(g, box(0.36, 0.14, 0.5), trim, [0, 0.53, -0.05]);
    const head = v(0, 0.47, 0.44);
    return { head, headRadius: 0.2, back: v(0, 0.58, -0.1), tailBase: v(0, 0.45, -0.55), chest: v(0, 0.36, 0.56), torso: { center: v(0, 0.35, 0), radius: 0.3, length: 0.9, axis: "z" }, hovers: true };
  },
};

/** Builds the model for one creature design. Throws never: an unknown part is simply skipped. */
export function buildCreatureModel(design: CreatureDesign): CreatureModel {
  const k = makeKit();
  const group = new THREE.Group();
  const body = new THREE.Group();
  group.add(body);
  const anchors = (BODIES[design.body] ?? BODIES.blob)(k, body, design);

  addPattern(k, body, design, anchors);
  addCrest(k, body, design, anchors);
  addTail(k, body, design, anchors);
  const iris = shade(design.primary, 0.5);
  if (design.body !== "vessel" || design.prop !== "eyeOfOsiris") {
    addEyes(k, body, design.eyes ?? "round", anchors.head, anchors.headRadius, iris);
  }
  if (design.prop && design.prop !== "none") addProp(k, body, design.prop, design.propColor ?? shade(design.primary, 0.8), anchors);

  // Normalise to about one unit tall, feet on the ground.
  const bounds = new THREE.Box3().setFromObject(body);
  const size = bounds.getSize(new THREE.Vector3());
  const scale = 1 / Math.max(size.y, size.x * 0.8, size.z * 0.7, 0.001);
  body.scale.setScalar(scale);
  body.position.y = -bounds.min.y * scale;
  body.userData.baseY = body.position.y;

  return {
    group,
    materials: k.mats,
    headHeight: (anchors.head.y - bounds.min.y) * scale,
    hovers: !!anchors.hovers || design.body === "avian",
    swaying: k.swaying,
  };
}

/** Frees the GPU memory a model holds. */
export function disposeModel(model: CreatureModel): void {
  model.group.traverse((object) => {
    const mesh = object as THREE.Mesh;
    mesh.geometry?.dispose();
  });
  for (const material of model.materials) material.dispose();
}
