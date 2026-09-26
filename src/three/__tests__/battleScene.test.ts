/**
 * @jest-environment node
 */
import * as THREE from "three";
import { createBattleScene } from "../battleScene";

// The scene uses a canvas only for its glow sprite; give it a minimal stand-in.
beforeAll(() => {
  (globalThis as unknown as { document: unknown }).document = {
    createElement: () => ({
      width: 0,
      height: 0,
      getContext: () => ({ createRadialGradient: () => ({ addColorStop: () => {} }), fillRect: () => {}, fillStyle: "" }),
    }),
  };
});

describe("3D battle scene", () => {
  for (const biome of ["grass", "rock", "sand", "water"] as const) {
    it(`builds and runs the ${biome} scene`, () => {
      const scene = createBattleScene(biome);
      scene.setCreature("player", { body: "quadruped", primary: "#7cc45a", crest: "horn", tail: "leaf" });
      scene.setCreature("enemy", { body: "insect", primary: "#e8b93c", pattern: "stripes", prop: "honeycomb" });
      scene.resize(400, 260);
      scene.fireProjectile("Fire", "toEnemy", 360);
      scene.throwBall(480);
      scene.cruxBurst();
      scene.itemFlash("#7ddba0");
      for (let i = 0; i < 90; i++) scene.frame(1 / 60, i / 60);
      let meshes = 0;
      scene.scene.traverse((o) => {
        if ((o as THREE.Mesh).isMesh) meshes++;
      });
      expect(meshes).toBeGreaterThan(20);
      scene.dispose();
    });
  }
});
