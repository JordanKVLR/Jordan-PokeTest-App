import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import type { Animated } from "react-native";
import type { Biome, TypeName } from "../../data/schemas";
import { designFor } from "../../art/creatureDesigns";
import { ThreeView } from "../../three/ThreeView";
import { createBattleScene, type AnimSample, type BattleSceneApi } from "../../three/battleScene";
import { useSettings } from "../../state/settingsStore";
import { typeColor } from "../theme";
import type { useCombatantAnimation } from "./useCombatantAnimation";

type Anim = ReturnType<typeof useCombatantAnimation>;

export interface Battle3DHandle {
  fireProjectile: (type: TypeName, direction: "toEnemy" | "toPlayer", durationMs: number) => void;
  throwBall: (durationMs: number) => void;
  cruxBurst: () => void;
  itemFlash: (tint: string) => void;
}

interface Side {
  speciesId: string;
  types: TypeName[];
  anim: Anim;
}

/** Reads an Animated.Value's current number without subscribing — the scene samples every frame. */
function read(value: Animated.Value): number {
  return (value as unknown as { __getValue: () => number }).__getValue();
}

function sampler(anim: Anim): () => AnimSample {
  return () => ({
    shakeX: read(anim.shakeX),
    scale: read(anim.scale),
    opacity: read(anim.opacity),
    hitFlash: read(anim.hitFlash),
    healFlash: read(anim.healFlash),
  });
}

/**
 * The battle drawn in 3D: the same combatants, animations and effects the 2D stage has, as a
 * lit scene with real depth and shadows. The name plates and HP bars stay as regular UI on top.
 */
export const Battle3D = forwardRef<Battle3DHandle, { biome: Biome; enemy: Side; player: Side }>(function Battle3D(
  { biome, enemy, player },
  ref
) {
  const reducedMotion = useSettings((s) => s.reducedMotion);
  const api = useRef<BattleSceneApi | null>(null);
  const latest = useRef({ enemy, player });
  latest.current = { enemy, player };

  useImperativeHandle(ref, () => ({
    fireProjectile: (type, direction, durationMs) => api.current?.fireProjectile(type, direction, durationMs),
    throwBall: (durationMs) => api.current?.throwBall(durationMs),
    cruxBurst: () => api.current?.cruxBurst(),
    itemFlash: (tint) => api.current?.itemFlash(tint),
  }));

  // A new creature steps in (a switch, a trainer's next one): rebuild just that model.
  useEffect(() => {
    api.current?.setCreature("enemy", designFor(enemy.speciesId, enemy.types, typeColor));
    api.current?.setAnimSource("enemy", sampler(enemy.anim));
  }, [enemy.speciesId, enemy.types, enemy.anim]);
  useEffect(() => {
    api.current?.setCreature("player", designFor(player.speciesId, player.types, typeColor));
    api.current?.setAnimSource("player", sampler(player.anim));
  }, [player.speciesId, player.types, player.anim]);

  return (
    <ThreeView
      testID="battle-3d"
      create={() => {
        const scene = createBattleScene(biome, { reducedMotion });
        const { enemy: e, player: p } = latest.current;
        scene.setCreature("enemy", designFor(e.speciesId, e.types, typeColor));
        scene.setCreature("player", designFor(p.speciesId, p.types, typeColor));
        scene.setAnimSource("enemy", sampler(e.anim));
        scene.setAnimSource("player", sampler(p.anim));
        api.current = scene;
        return scene;
      }}
    />
  );
});
