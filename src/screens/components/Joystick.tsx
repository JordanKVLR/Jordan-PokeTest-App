import { useRef, useState } from "react";
import { Animated, PanResponder, StyleSheet, View } from "react-native";
import { colors, world } from "../theme";

export type Direction = "up" | "down" | "left" | "right";

const BASE_SIZE = 132;
const KNOB_SIZE = 56;
const MAX_OFFSET = (BASE_SIZE - KNOB_SIZE) / 2;
/** Drag distance before a direction registers — stops a stray tap from taking a step. */
const DEAD_ZONE = 14;
/** While held, steps repeat at this rate, so you can walk a long road without re-dragging. */
const REPEAT_MS = 190;

/**
 * A thumb-stick for walking the map. Movement is still tile-by-tile underneath — the stick
 * reports a direction and repeats while held, rather than giving free analogue movement —
 * so the grid, the encounter checks and the D-pad all keep working the same way.
 */
export function Joystick({ onStep, disabled }: { onStep: (direction: Direction) => void; disabled?: boolean }) {
  const knob = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const [active, setActive] = useState(false);
  const repeatTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const heldDirection = useRef<Direction | null>(null);
  // Kept in a ref as well as state so the pan handlers (created once) always see the latest.
  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;

  function stopRepeat() {
    if (repeatTimer.current) {
      clearInterval(repeatTimer.current);
      repeatTimer.current = null;
    }
    heldDirection.current = null;
  }

  function directionFor(dx: number, dy: number): Direction | null {
    if (Math.hypot(dx, dy) < DEAD_ZONE) return null;
    // Whichever axis dominates wins, so diagonals resolve to a single grid step.
    return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up";
  }

  function handleDirection(direction: Direction | null) {
    if (direction === heldDirection.current) return;
    stopRepeat();
    if (!direction) return;
    heldDirection.current = direction;
    onStep(direction);
    repeatTimer.current = setInterval(() => {
      if (disabledRef.current) return;
      if (heldDirection.current) onStep(heldDirection.current);
    }, REPEAT_MS);
  }

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => setActive(true),
      onPanResponderMove: (_evt, gesture) => {
        const clampedX = Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, gesture.dx));
        const clampedY = Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, gesture.dy));
        knob.setValue({ x: clampedX, y: clampedY });
        handleDirection(directionFor(gesture.dx, gesture.dy));
      },
      onPanResponderRelease: () => {
        setActive(false);
        stopRepeat();
        Animated.spring(knob, { toValue: { x: 0, y: 0 }, useNativeDriver: false, friction: 5 }).start();
      },
      onPanResponderTerminate: () => {
        setActive(false);
        stopRepeat();
        Animated.spring(knob, { toValue: { x: 0, y: 0 }, useNativeDriver: false, friction: 5 }).start();
      },
    })
  ).current;

  return (
    <View testID="joystick" style={[styles.base, active && styles.baseActive]} {...pan.panHandlers}>
      <View style={styles.crosshair} />
      <Animated.View
        testID="joystick-knob"
        style={[styles.knob, { transform: [{ translateX: knob.x }, { translateY: knob.y }] }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    width: BASE_SIZE,
    height: BASE_SIZE,
    borderRadius: BASE_SIZE / 2,
    backgroundColor: "rgba(255,255,255,0.75)",
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.shadow,
    shadowOpacity: 1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  baseActive: {
    borderColor: colors.accent,
    backgroundColor: "rgba(255,255,255,0.92)",
  },
  crosshair: {
    position: "absolute",
    width: BASE_SIZE * 0.52,
    height: BASE_SIZE * 0.52,
    borderRadius: BASE_SIZE * 0.26,
    borderWidth: 1,
    borderColor: world.limestoneDark,
    opacity: 0.35,
  },
  knob: {
    width: KNOB_SIZE,
    height: KNOB_SIZE,
    borderRadius: KNOB_SIZE / 2,
    backgroundColor: colors.accent,
    borderWidth: 2,
    borderColor: colors.accentDeep,
  },
});
