import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop } from "react-native-svg";
import { world } from "../screens/theme";

/**
 * The title screen's backdrop: the Dingli cliffs at the western end of the island, looking out
 * over open sea at the end of the afternoon.
 *
 * It is the one view that is unmistakably Maltese without a single building in it — a shelf of
 * pale globigerina limestone dropping two hundred metres into blue, terraced rubble walls
 * stepping down towards the edge, prickly pear on the headland, and the small uninhabited rock
 * of Filfla sitting offshore. Everything moves slowly: the sea swells, clouds drift, the sun
 * sinks a little, gulls cross. Nothing loops sharply enough to catch the eye twice.
 */

const VIEW_W = 400;
const VIEW_H = 720;

// SVG groups are moved through their own x/y props rather than a React Native transform: an
// <Svg> child is not a view and has no style, so the driver has to stay on the JS side.
const AnimatedG = Animated.createAnimatedComponent(G);

/** A value that eases back and forth forever — used for every drift on this screen. */
function useDrift(duration: number, delay = 0) {
  const value = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(value, { toValue: 1, duration, delay, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
        Animated.timing(value, { toValue: 0, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [value, duration, delay]);
  return value;
}

/** A value that runs 0 -> 1 and snaps back, for things that cross the screen one way. */
function useSweep(duration: number, delay = 0) {
  const value = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(value, { toValue: 1, duration, delay, easing: Easing.linear, useNativeDriver: false })
    );
    loop.start();
    return () => loop.stop();
  }, [value, duration, delay]);
  return value;
}

export function TitleLandscape() {
  const swellNear = useDrift(4200);
  const swellFar = useDrift(6800, 400);
  const cloudSlow = useSweep(52000);
  const cloudFast = useSweep(34000, 6000);
  const gulls = useSweep(19000);
  const sun = useDrift(14000);
  const pear = useDrift(5200, 900);

  const span = (v: Animated.Value, from: number, to: number) =>
    v.interpolate({ inputRange: [0, 1], outputRange: [from, to] }) as unknown as number;
  const tx = (v: Animated.Value, from: number, to: number) => ({ x: span(v, from, to) });
  const ty = (v: Animated.Value, from: number, to: number) => ({ y: span(v, from, to) });

  return (
    <View testID="title-landscape" style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} preserveAspectRatio="xMidYMid slice">
        <Defs>
          <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#8fd0ef" />
            <Stop offset="0.52" stopColor="#cfe9f7" />
            <Stop offset="1" stopColor="#f6e2bd" />
          </LinearGradient>
          <LinearGradient id="sea" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#2f7fae" />
            <Stop offset="1" stopColor="#1d5f8c" />
          </LinearGradient>
          <LinearGradient id="cliff" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#efdfba" />
            <Stop offset="1" stopColor="#c9ab7e" />
          </LinearGradient>
        </Defs>

        <Rect x="0" y="0" width={VIEW_W} height={VIEW_H} fill="url(#sky)" />

        {/* Sun, easing down a few pixels over a quarter of a minute. */}
        <AnimatedG {...ty(sun, 0, 14)}>
          <Circle cx="300" cy="150" r="34" fill="#ffd98a" opacity={0.55} />
          <Circle cx="300" cy="150" r="21" fill="#ffe9b6" />
        </AnimatedG>

        {/* Two cloud banks crossing at different speeds. */}
        <AnimatedG {...tx(cloudSlow, -520, VIEW_W + 60)} opacity={0.85}>
          <Cloud x={0} y={96} scale={1} />
        </AnimatedG>
        <AnimatedG {...tx(cloudFast, -560, VIEW_W + 40)} opacity={0.6}>
          <Cloud x={0} y={58} scale={0.68} />
        </AnimatedG>

        {/* Sea, with Filfla sitting on the horizon. */}
        <Rect x="0" y="300" width={VIEW_W} height={VIEW_H - 300} fill="url(#sea)" />
        <Path d="M 296 300 q 10 -13 22 -3 q 8 6 16 3 l 4 3 z" fill="#7d93a0" opacity={0.85} />

        {/* Swell: two bands sliding against each other so the water never sits still. */}
        <AnimatedG {...tx(swellFar, -12, 12)} opacity={0.5}>
          <Swell y={330} />
          <Swell y={366} />
        </AnimatedG>
        <AnimatedG {...tx(swellNear, 14, -14)} opacity={0.72}>
          <Swell y={402} />
          <Swell y={446} />
          <Swell y={494} />
        </AnimatedG>

        {/* Gulls, crossing right to left well out over the water. */}
        <AnimatedG {...tx(gulls, VIEW_W + 40, -60)}>
          <Gull x={0} y={214} scale={1} />
          <Gull x={38} y={236} scale={0.75} />
          <Gull x={16} y={258} scale={0.6} />
        </AnimatedG>

        {/* The cliff itself. The point of Dingli is the drop, so the land does not slope into
            the water — it stops. A sheer face with horizontal bedding planes runs the width of
            the screen, with a talus of fallen blocks piled at the waterline. */}
        <Path
          d={`M 0 ${VIEW_H} L 0 508 L 96 502 L 188 512 L 286 500 L ${VIEW_W} 508 L ${VIEW_W} ${VIEW_H} Z`}
          fill="#b99a68"
        />
        {/* Bedding planes across the face — limestone is laid down in courses and reads that way. */}
        <Path d="M 0 534 L 96 528 L 188 538 L 286 526 L 400 534" stroke="#a88a5c" strokeWidth={3} fill="none" opacity={0.7} />
        <Path d="M 0 564 L 100 559 L 196 569 L 292 557 L 400 564" stroke="#a88a5c" strokeWidth={2.5} fill="none" opacity={0.55} />
        <Path d="M 0 596 L 104 591 L 200 601 L 296 589 L 400 596" stroke="#a88a5c" strokeWidth={2} fill="none" opacity={0.4} />
        {/* Talus: blocks that have come off the face and collected at the foot. */}
        <G opacity={0.9}>
          <Ellipse cx="54" cy="512" rx="30" ry="9" fill="#c7a875" />
          <Ellipse cx="228" cy="518" rx="38" ry="10" fill="#c7a875" />
          <Ellipse cx="352" cy="512" rx="28" ry="8" fill="#c7a875" />
        </G>
        {/* The clifftop plateau, brighter because the afternoon sun is still on it. */}
        <Path
          d={`M 0 508 L 96 502 L 188 512 L 286 500 L ${VIEW_W} 508 L ${VIEW_W} 476 Q 300 462 196 478 Q 96 492 0 474 Z`}
          fill="#e9d7ab"
        />
        {/* Terraced rubble walls stepping back from the edge. */}
        <Path d="M 0 612 Q 90 598 168 620 Q 250 644 400 628" stroke="#a88a5c" strokeWidth={5} fill="none" opacity={0.6} />
        <Path d="M 0 660 Q 110 646 200 670 Q 300 696 400 678" stroke="#a88a5c" strokeWidth={5} fill="none" opacity={0.5} />
        <Path
          d={`M 0 ${VIEW_H} L 0 684 Q 120 670 214 698 Q 320 726 ${VIEW_W} 708 L ${VIEW_W} ${VIEW_H} Z`}
          fill={world.limestone}
        />

        {/* Prickly pear on the headland, leaning very slightly in the wind. */}
        <AnimatedG {...tx(pear, -1.5, 1.5)}>
          <PricklyPear x={44} y={648} scale={1} />
          <PricklyPear x={330} y={672} scale={0.8} />
        </AnimatedG>
        <G opacity={0.75}>
          <Ellipse cx="150" cy="700" rx="26" ry="9" fill="#9bb36a" />
          <Ellipse cx="262" cy="716" rx="32" ry="10" fill="#8fa861" />
        </G>
      </Svg>
    </View>
  );
}

/**
 * A bank of three clouds spread across more than a screen width. A single cloud on a fifty-
 * second crossing spends most of its cycle off-screen, which meant the sky usually looked
 * empty; spacing three across the sweep keeps at least one of them in view at all times.
 */
function Cloud({ x, y, scale }: { x: number; y: number; scale: number }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${scale})`}>
      {[0, 250, 470].map((offset, i) => (
        <G key={offset} transform={`translate(${offset} ${i * 16 - 10})`}>
          <Ellipse cx="60" cy="20" rx={52 - i * 8} ry={17 - i * 2} fill="#ffffff" />
          <Ellipse cx="102" cy="24" rx={34 - i * 5} ry={13 - i * 1} fill="#ffffff" />
          <Ellipse cx="28" cy="26" rx={30 - i * 4} ry={12 - i} fill="#f4fbff" />
        </G>
      ))}
    </G>
  );
}

function Swell({ y }: { y: number }) {
  return (
    <Path
      d={`M -30 ${y} q 26 -7 52 0 t 52 0 t 52 0 t 52 0 t 52 0 t 52 0 t 52 0`}
      stroke="#bfe4f5"
      strokeWidth={3}
      fill="none"
      strokeLinecap="round"
    />
  );
}

function Gull({ x, y, scale }: { x: number; y: number; scale: number }) {
  return (
    <Path
      d={`M ${x} ${y} q ${6 * scale} ${-5 * scale} ${12 * scale} 0 q ${6 * scale} ${-5 * scale} ${12 * scale} 0`}
      stroke="#5c6f7c"
      strokeWidth={1.8 * scale}
      fill="none"
      strokeLinecap="round"
      opacity={0.7}
    />
  );
}

function PricklyPear({ x, y, scale }: { x: number; y: number; scale: number }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${scale})`}>
      <Ellipse cx="0" cy="0" rx="13" ry="18" fill="#6f9a4e" />
      <Ellipse cx="-14" cy="-14" rx="10" ry="14" fill="#7fae5a" />
      <Ellipse cx="13" cy="-18" rx="9" ry="13" fill="#628c45" />
      <Circle cx="-14" cy="-26" r="3.2" fill="#e0763c" />
      <Circle cx="13" cy="-30" r="3" fill="#e08a3c" />
    </G>
  );
}
