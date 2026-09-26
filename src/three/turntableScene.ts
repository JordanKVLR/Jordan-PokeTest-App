import * as THREE from "three";
import type { CreatureDesign } from "../art/creatureArt";
import { buildCreatureModel, disposeModel } from "./creatureModel";

/**
 * A creature on a slowly turning plinth, studio-lit — for its page in the Codex and the party,
 * where there is room to look at it properly.
 */
export function createTurntableScene(design: CreatureDesign, options: { reducedMotion?: boolean } = {}) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#dfeef6");
  scene.fog = new THREE.Fog("#dfeef6", 4, 9);
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  camera.position.set(0, 1.0, 2.7);
  camera.lookAt(0, 0.55, 0);

  scene.add(new THREE.HemisphereLight("#eef6ff", "#b8a88a", 1.1));
  const key = new THREE.DirectionalLight("#fff2dc", 2.6);
  key.position.set(-2.5, 4, 3);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -1.5;
  key.shadow.camera.right = 1.5;
  key.shadow.camera.top = 1.5;
  key.shadow.camera.bottom = -1.5;
  key.shadow.bias = -0.0008;
  key.shadow.normalBias = 0.02;
  scene.add(key);
  const rim = new THREE.DirectionalLight("#bfe0ff", 1.4);
  rim.position.set(2.5, 2, -3);
  scene.add(rim);

  // A floor that fades into the backdrop, so the creature stands somewhere rather than floating.
  const floor = new THREE.Mesh(new THREE.CircleGeometry(6, 48), new THREE.MeshStandardMaterial({ color: "#d4e4ec", roughness: 1 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.12;
  floor.receiveShadow = true;
  scene.add(floor);

  const plinth = new THREE.Mesh(
    new THREE.CylinderGeometry(0.85, 0.92, 0.12, 48),
    new THREE.MeshStandardMaterial({ color: "#e6dcc4", roughness: 0.85 })
  );
  plinth.position.y = -0.06;
  plinth.receiveShadow = true;
  scene.add(plinth);

  const model = buildCreatureModel(design);
  model.group.scale.setScalar(1.15);
  scene.add(model.group);

  return {
    scene,
    camera,
    frame(dt: number, time: number) {
      if (!options.reducedMotion) model.group.rotation.y = Math.sin(time * 0.5) * 0.9 + 0.35;
      const bob = model.hovers ? 0.12 + Math.sin(time * 2.2) * 0.05 : 0;
      model.group.position.y = bob;
      for (const part of model.swaying) {
        if (part.userData.spin) part.rotation.y += dt * 6;
        else if (part.userData.flap) part.rotation.z = Math.sin(time * (model.hovers ? 9 : 3)) * 0.35 * part.userData.flap;
        else part.rotation.z = Math.sin(time * 1.8 + part.id) * 0.12;
      }
    },
    resize(width: number, height: number) {
      camera.aspect = width / Math.max(1, height);
      camera.updateProjectionMatrix();
    },
    dispose() {
      disposeModel(model);
      plinth.geometry.dispose();
      floor.geometry.dispose();
      (floor.material as THREE.Material).dispose();
      (plinth.material as THREE.Material).dispose();
    },
  };
}
