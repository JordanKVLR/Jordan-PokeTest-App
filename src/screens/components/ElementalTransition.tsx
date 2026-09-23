import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Dimensions, Easing, Pressable, StyleSheet, Text } from "react-native";
import Svg, { Circle, Path, Polygon, Rect } from "react-native-svg";
import type { TypeName } from "../../data/schemas";
import { TYPE_COLORS, shade } from "../theme";

/**
 * The wipe that plays into a trainer battle, themed to the type that trainer fights under.
 *
 * Eighteen bespoke animations would be eighteen things to maintain, so instead each type picks
 * a motion and a shape from a shared vocabulary: embers rise, waves sweep, frost converges,
 * plates shut. The result reads as specific to the element without any of them being one-off
 * code, and the trainer's own line rides in on top of it.
 */

type Motion = "rise" | "fall" | "sweep" | "burst" | "converge" | "spiral";
type Shape = "circle" | "shard" | "leaf" | "bolt" | "plate" | "ring";

interface ElementStyle {
  motion: Motion;
  shape: Shape;
  /** How many particles. Heavy elements use fewer, larger pieces. */
  count: number;
}

const ELEMENT_STYLE: Record<TypeName, ElementStyle> = {
  Fire: { motion: "rise", shape: "circle", count: 18 },
  Water: { motion: "sweep", shape: "ring", count: 12 },
  Grass: { motion: "fall", shape: "leaf", count: 16 },
  Electric: { motion: "burst", shape: "bolt", count: 14 },
  Ice: { motion: "converge", shape: "shard", count: 16 },
  Rock: { motion: "fall", shape: "shard", count: 12 },
  Ground: { motion: "rise", shape: "shard", count: 14 },
  Steel: { motion: "converge", shape: "plate", count: 8 },
  Flying: { motion: "sweep", shape: "leaf", count: 14 },
  Fighting: { motion: "burst", shape: "plate", count: 10 },
  Psychic: { motion: "spiral", shape: "ring", count: 10 },
  Ghost: { motion: "converge", shape: "circle", count: 12 },
  Dark: { motion: "converge", shape: "circle", count: 10 },
  Fairy: { motion: "burst", shape: "ring", count: 14 },
  Bug: { motion: "spiral", shape: "circle", count: 18 },
  Poison: { motion: "rise", shape: "circle", count: 14 },
  Dragon: { motion: "spiral", shape: "shard", count: 12 },
  Normal: { motion: "sweep", shape: "circle", count: 12 },
};

const DURATION = 1100;

/** Deterministic jitter, so a given trainer's wipe looks the same each time you fight them. */
function scatter(seed: number, i: number): number {
  const x = Math.sin(seed * 977 + i * 131.7) * 43758.5453;
  return x - Math.floor(x);
}

export function ElementalTransition({
  type,
  trainerName,
  line,
  onDone,
}: {
  type: TypeName;
  trainerName: string;
  line: string;
  onDone: () => void;
}) {
  const progress = useRef(new Animated.Value(0)).current;
  const textFade = useRef(new Animated.Value(0)).current;
  const { width, height } = Dimensions.get("window");
  const style = ELEMENT_STYLE[type] ?? ELEMENT_STYLE.Normal;
  const base = TYPE_COLORS[type] ?? "#8a9aa5";
  const seed = useMemo(() => [...trainerName].reduce((h, c) => h + c.charCodeAt(0), 7), [trainerName]);

  const [ready, setReady] = useState(false);

  useEffect(() => {
    Animated.sequence([
      Animated.timing(progress, { toValue: 1, duration: DURATION, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
      Animated.timing(textFade, { toValue: 1, duration: 320, useNativeDriver: false }),
    ]).start(({ finished }) => {
      // The wipe no longer times itself out. Once the trainer's line is legible it stays there
      // until the player taps it away — the same rule the rest of the battle now follows.
      if (finished) setReady(true);
    });
    // onDone is a fresh closure each render; re-running the sequence would restart the wipe.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ends fully opaque: a half-covered battle screen behind the trainer's line reads as a
  // rendering fault rather than a transition.
  const washOpacity = progress.interpolate({ inputRange: [0, 0.45, 1], outputRange: [0, 0.94, 1] });

  return (
    <Pressable
      testID={`elemental-transition-${type}`}
      accessibilityRole="button"
      accessibilityLabel={`${trainerName}. ${line}. Tap to begin the battle.`}
      onPress={() => {
        if (ready) onDone();
      }}
      style={StyleSheet.absoluteFill}
    >
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: shade(base, 0.55), opacity: washOpacity }]} />

      <Animated.View style={[StyleSheet.absoluteFill, { opacity: progress }]}>
        <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          {Array.from({ length: style.count }).map((_, i) => (
            <Particle
              key={i}
              index={i}
              seed={seed}
              style={style}
              color={i % 3 === 0 ? shade(base, 1.35) : base}
              width={width}
              height={height}
            />
          ))}
        </Svg>
      </Animated.View>

      <Animated.View style={[styles.textWrap, { opacity: textFade }]}>
        <Text style={styles.name}>{trainerName}</Text>
        <Text style={styles.line}>“{line}”</Text>
        {ready && (
          <Text testID="transition-continue" style={styles.tap}>
            Tap to begin
          </Text>
        )}
      </Animated.View>
    </Pressable>
  );
}

/**
 * One piece of the wipe, placed by its motion. These are static positions inside an SVG that
 * the parent fades and scales as a whole — animating 18 individual SVG nodes on the web
 * renderer costs far more than it looks, and the composite reads the same.
 */
function Particle({
  index,
  seed,
  style,
  color,
  width,
  height,
}: {
  index: number;
  seed: number;
  style: ElementStyle;
  color: string;
  width: number;
  height: number;
}) {
  const a = scatter(seed, index);
  const b = scatter(seed, index + 100);
  const size = 12 + a * 26;

  let cx = a * width;
  let cy = b * height;
  switch (style.motion) {
    case "rise":
      cy = height - (index / style.count) * height * 0.95 - b * 40;
      break;
    case "fall":
      cy = (index / style.count) * height * 0.95 + b * 40;
      break;
    case "sweep":
      cx = (index / style.count) * width;
      cy = height * 0.2 + b * height * 0.6;
      break;
    case "burst": {
      const angle = (index / style.count) * Math.PI * 2;
      const radius = (0.2 + b * 0.32) * Math.min(width, height);
      cx = width / 2 + Math.cos(angle) * radius;
      cy = height / 2 + Math.sin(angle) * radius;
      break;
    }
    case "converge": {
      const angle = (index / style.count) * Math.PI * 2;
      const radius = (0.34 - b * 0.16) * Math.min(width, height);
      cx = width / 2 + Math.cos(angle) * radius;
      cy = height / 2 + Math.sin(angle) * radius;
      break;
    }
    case "spiral": {
      const t = index / style.count;
      const angle = t * Math.PI * 4;
      const radius = t * 0.38 * Math.min(width, height);
      cx = width / 2 + Math.cos(angle) * radius;
      cy = height / 2 + Math.sin(angle) * radius;
      break;
    }
  }

  const opacity = 0.35 + a * 0.5;
  switch (style.shape) {
    case "circle":
      return <Circle cx={cx} cy={cy} r={size / 2} fill={color} opacity={opacity} />;
    case "ring":
      return (
        <Circle cx={cx} cy={cy} r={size} fill="none" stroke={color} strokeWidth={2 + a * 2} opacity={opacity} />
      );
    case "shard":
      return (
        <Polygon
          points={`${cx},${cy - size} ${cx + size * 0.5},${cy} ${cx},${cy + size} ${cx - size * 0.5},${cy}`}
          fill={color}
          opacity={opacity}
        />
      );
    case "leaf":
      return (
        <Path
          d={`M ${cx} ${cy} q ${size} ${-size * 0.6} ${size * 1.6} 0 q ${-size} ${size * 0.6} ${-size * 1.6} 0 z`}
          fill={color}
          opacity={opacity}
        />
      );
    case "bolt":
      return (
        <Polygon
          points={`${cx},${cy - size} ${cx + size * 0.4},${cy - size * 0.1} ${cx + size * 0.05},${cy - size * 0.1} ${cx + size * 0.35},${cy + size} ${cx - size * 0.4},${cy + size * 0.05} ${cx - size * 0.05},${cy + size * 0.05}`}
          fill={color}
          opacity={opacity}
        />
      );
    case "plate":
      return (
        <Rect
          x={cx - size}
          y={cy - size * 0.35}
          width={size * 2}
          height={size * 0.7}
          rx={3}
          fill={color}
          opacity={opacity}
        />
      );
  }
}

const styles = StyleSheet.create({
  textWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 34,
  },
  name: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 10,
    textAlign: "center",
  },
  line: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    fontStyle: "italic",
  },
  tap: {
    marginTop: 26,
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
});
