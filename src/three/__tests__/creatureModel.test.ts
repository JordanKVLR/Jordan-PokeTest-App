import * as THREE from "three";
import { DEX_ENTRIES } from "../../game/speciesCatalog";
import { designFor } from "../../art/creatureDesigns";
import { typeColor } from "../../screens/theme";
import { buildCreatureModel, disposeModel } from "../creatureModel";

describe("3D creature models", () => {
  it("builds a model for every species in the game", () => {
    const problems: string[] = [];
    for (const entry of DEX_ENTRIES) {
      const design = designFor(entry.speciesId, entry.types, typeColor);
      const model = buildCreatureModel(design);
      const bounds = new THREE.Box3().setFromObject(model.group);
      const size = bounds.getSize(new THREE.Vector3());
      // About one unit tall, standing on the ground, and not absurdly wide.
      if (Math.abs(bounds.min.y) > 0.02) problems.push(`${entry.speciesId} floats or sinks (${bounds.min.y.toFixed(2)})`);
      if (size.y < 0.6 || size.y > 1.05) problems.push(`${entry.speciesId} is ${size.y.toFixed(2)} tall`);
      if (size.x > 1.6 || size.z > 1.8) problems.push(`${entry.speciesId} is ${size.x.toFixed(2)} x ${size.z.toFixed(2)} wide`);
      if (model.materials.length === 0) problems.push(`${entry.speciesId} has no materials`);
      let meshes = 0;
      model.group.traverse((o) => {
        if ((o as THREE.Mesh).isMesh) meshes++;
      });
      if (meshes < 5) problems.push(`${entry.speciesId} has only ${meshes} parts`);
      disposeModel(model);
    }
    expect(problems).toEqual([]);
  });

  it("gives every body archetype a head above its feet", () => {
    for (const body of ["quadruped", "feline", "biped", "serpent", "avian", "golem", "blob", "mollusc", "insect", "aquatic", "vessel"] as const) {
      const model = buildCreatureModel({ body, primary: "#7cc45a" });
      expect({ body, above: model.headHeight > 0.2 }).toEqual({ body, above: true });
    }
  });
});
