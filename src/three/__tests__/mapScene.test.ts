/**
 * @jest-environment node
 */
import * as THREE from "three";
import { getMap } from "../../game/mapData";
import { STAGES } from "../../game/zoneProgression";
import { createMapScene } from "../mapScene";

describe("3D map scene", () => {
  it("builds every stage of the run and walks the camera along", () => {
    for (const stage of STAGES) {
      const map = getMap(stage.id);
      let x = map.playerStart.col;
      const scene = createMapScene(map, { position: () => ({ x, y: map.playerStart.row }) }, { position: () => ({ x: x - 1, y: map.playerStart.row }) });
      scene.setFollower({ body: "feline", primary: "#f0a04b", crest: "ears", tail: "long" });
      scene.setTrainers([{ id: "t", row: map.playerStart.row, col: map.playerStart.col + 3, isGymLeader: true, defeated: false }]);
      scene.setFacing("right");
      scene.resize(390, 844);
      for (let i = 0; i < 30; i++) {
        x += 0.05;
        scene.frame(1 / 60, i / 60);
      }
      // The camera ends up behind and above the player, looking toward them.
      expect(scene.camera.position.y).toBeGreaterThan(3);
      expect(Math.abs(scene.camera.position.x - x)).toBeLessThan(1.5);
      let meshes = 0;
      scene.scene.traverse((o) => {
        if ((o as THREE.Mesh).isMesh) meshes++;
      });
      expect(meshes).toBeGreaterThan(30);
      scene.dispose();
    }
  });
});

describe("3D title scene", () => {
  it("builds and animates the coastline", () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { createTitleScene } = require("../titleScene");
    const title = createTitleScene();
    title.resize(390, 844);
    for (let i = 0; i < 20; i++) title.frame(1 / 60, i / 60);
    expect(title.camera.position.y).toBeGreaterThan(2);
    title.dispose();
  });
});
