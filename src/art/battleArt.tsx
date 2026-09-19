import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop } from "react-native-svg";
import { world } from "../screens/theme";
import type { Biome } from "../data/schemas";

/**
 * The backdrop a battle happens against. Each biome gets its own horizon — you are always
 * somewhere specific on the islands rather than on a generic coloured panel — and the two
 * combatants stand on drawn platforms so they read as placed in a scene, not floating.
 *
 * Drawn at a 0..200 x 0..100 viewBox and stretched, since the stage is a wide, short band.
 */
export function BattleBackdrop({ biome, width, height }: { biome: Biome; width: number; height: number }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 200 100" preserveAspectRatio="none">
      <Defs>
        <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={world.skyTop} />
          <Stop offset="1" stopColor={world.skyLow} />
        </LinearGradient>
        <LinearGradient id="sea" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={world.sea} />
          <Stop offset="1" stopColor={world.seaDeep} />
        </LinearGradient>
      </Defs>

      <Rect x={0} y={0} width={200} height={100} fill="url(#sky)" />
      <Circle cx={168} cy={16} r={13} fill={world.sunHaze} opacity={0.75} />

      <Scene biome={biome} />
    </Svg>
  );
}

function Scene({ biome }: { biome: Biome }) {
  switch (biome) {
    /** Inland garrigue: terraced rubble walls stepping up behind a green field. */
    case "grass":
      return (
        <G>
          <Path d="M0 46 q30 -10 58 -2 q26 7 52 -4 q30 -12 56 2 q22 8 34 4 l0 14 l-200 0 z" fill={world.treeCanopyDark} opacity={0.55} />
          <Rect x={0} y={54} width={200} height={46} fill={world.grass} />
          <Path d="M0 54 q50 -8 100 0 q50 8 100 0 l0 10 l-200 0 z" fill={world.grassLight} opacity={0.65} />
          <Path d="M0 70 h200" stroke={world.limestoneDark} strokeWidth={4} opacity={0.35} />
          <Path d="M0 66 h200" stroke={world.limestoneLight} strokeWidth={2.5} opacity={0.35} />
        </G>
      );

    /** Quarry country: stacked limestone faces under a hard bright sky. */
    case "rock":
      return (
        <G>
          <Path d="M0 40 l26 -14 l30 16 l34 -12 l32 14 l30 -10 l48 16 l0 10 l-200 0 z" fill={world.limestoneDark} opacity={0.75} />
          <Rect x={0} y={50} width={200} height={50} fill={world.limestone} />
          <Path d="M0 50 q50 -6 100 0 q50 6 100 0 l0 8 l-200 0 z" fill={world.limestoneLight} opacity={0.8} />
          <Path d="M18 62 h34 M70 68 h40 M130 60 h44" stroke={world.limestoneShadow} strokeWidth={2.4} opacity={0.4} strokeLinecap="round" />
        </G>
      );

    /** Harbour: open sea to the horizon with a limestone quay in the foreground. */
    case "water":
      return (
        <G>
          <Rect x={0} y={44} width={200} height={40} fill="url(#sea)" />
          <Path d="M10 54 q10 -5 20 0 M60 62 q10 -5 20 0 M120 56 q10 -5 20 0 M160 66 q10 -5 20 0" stroke={world.seaFoam} strokeWidth={2.4} fill="none" opacity={0.8} strokeLinecap="round" />
          <Rect x={0} y={80} width={200} height={20} fill={world.limestone} />
          <Path d="M0 80 q50 -5 100 0 q50 5 100 0 l0 6 l-200 0 z" fill={world.limestoneLight} opacity={0.85} />
        </G>
      );

    /** Dunes: bare sand ridges, a sliver of sea behind. */
    case "sand":
      return (
        <G>
          <Rect x={0} y={44} width={200} height={10} fill={world.sea} opacity={0.85} />
          <Path d="M0 54 q40 -12 78 -2 q34 9 62 -6 q32 -16 60 4 l0 50 l-200 0 z" fill={world.sandDark} />
          <Rect x={0} y={70} width={200} height={30} fill={world.sand} />
          <Path d="M0 70 q50 -7 100 0 q50 7 100 0 l0 8 l-200 0 z" fill={world.sand} opacity={0.9} />
          <Path d="M24 84 q12 -4 24 0 M110 90 q12 -4 24 0" stroke={world.sandDark} strokeWidth={2.2} fill="none" opacity={0.7} strokeLinecap="round" />
        </G>
      );

    default:
      return <Rect x={0} y={54} width={200} height={46} fill={world.grass} />;
  }
}

/** The disc a combatant stands on, so a sprite has ground under it rather than hanging in air. */
export function BattlePlatform({ size, biome }: { size: number; biome: Biome }) {
  const top = biome === "water" ? world.limestoneLight : biome === "sand" ? world.sand : biome === "rock" ? world.limestoneLight : world.grassLight;
  const side = biome === "water" ? world.limestoneDark : biome === "sand" ? world.sandDark : biome === "rock" ? world.limestoneDark : world.grassDark;
  return (
    <Svg width={size} height={size * 0.42} viewBox="0 0 100 42">
      <Ellipse cx={50} cy={26} rx={48} ry={14} fill={side} />
      <Ellipse cx={50} cy={21} rx={48} ry={14} fill={top} />
      <Ellipse cx={50} cy={21} rx={34} ry={9} fill="#ffffff" opacity={0.18} />
    </Svg>
  );
}
