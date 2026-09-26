import { useEffect, useRef } from "react";
import type { Animated } from "react-native";
import type { TileMap } from "../../game/mapData";
import type { TypeName } from "../../data/schemas";
import { designFor } from "../../art/creatureDesigns";
import { ThreeView } from "../../three/ThreeView";
import { createMapScene, type Facing, type MapSceneApi, type MapTrainer } from "../../three/mapScene";
import { useSettings } from "../../state/settingsStore";
import { typeColor } from "../theme";

/** Reads an Animated.ValueXY's current value without subscribing — the scene samples every frame. */
function read(value: Animated.ValueXY): { x: number; y: number } {
  const v = value as unknown as { x: { __getValue: () => number }; y: { __getValue: () => number } };
  return { x: v.x.__getValue(), y: v.y.__getValue() };
}

/**
 * The map drawn in 3D. It follows the same animated positions the 2D map uses, so movement,
 * encounters and everything else about the map are untouched — only the picture changes.
 */
export function Map3D({
  map,
  player,
  follower,
  facing,
  lead,
  trainers,
}: {
  map: TileMap;
  player: Animated.ValueXY;
  follower: Animated.ValueXY;
  facing: Facing;
  lead: { speciesId: string; types: TypeName[] } | null;
  trainers: MapTrainer[];
}) {
  const reducedMotion = useSettings((s) => s.reducedMotion);
  const api = useRef<MapSceneApi | null>(null);
  const latest = useRef({ facing, lead, trainers });
  latest.current = { facing, lead, trainers };

  useEffect(() => api.current?.setFacing(facing), [facing]);
  useEffect(() => {
    api.current?.setFollower(lead ? designFor(lead.speciesId, lead.types, typeColor) : null);
  }, [lead?.speciesId]);
  const trainerKey = trainers.map((t) => `${t.id}:${t.defeated}`).join(",");
  useEffect(() => api.current?.setTrainers(trainers), [trainerKey]);

  return (
    <ThreeView
      key={map.zoneId}
      testID="map-3d"
      create={() => {
        const scene = createMapScene(map, { position: () => read(player) }, { position: () => read(follower) }, { reducedMotion });
        const { facing: f, lead: l, trainers: t } = latest.current;
        scene.setFacing(f);
        scene.setFollower(l ? designFor(l.speciesId, l.types, typeColor) : null);
        scene.setTrainers(t);
        api.current = scene;
        return scene;
      }}
    />
  );
}
