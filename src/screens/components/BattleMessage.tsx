import { useEffect, useRef } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme";

/**
 * The battle's dialogue box: one beat of the fight, held on screen until the player taps it
 * away.
 *
 * The log alone was too fast to play on. A turn used to resolve on timers — both attacks, the
 * damage, the faint — and by the time you looked up the numbers had already scrolled. Nothing
 * in a battle advances on a clock any more: the player reads what happened, decides what it
 * means, and taps to continue.
 *
 * It sits over the action buttons rather than the creatures, so the thing the text is talking
 * about is still visible while you read about it.
 */
export function BattleMessage({
  lines,
  emphasis,
  onAdvance,
  remaining,
}: {
  lines: string[];
  /** Draws the eye to the beat that changed the fight — a big hit, a faint, a medal. */
  emphasis?: "none" | "good" | "bad";
  onAdvance: () => void;
  /** How many more popups are queued behind this one, for the "keep tapping" hint. */
  remaining: number;
}) {
  const enter = useRef(new Animated.Value(0)).current;
  const nudge = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    enter.setValue(0);
    Animated.timing(enter, {
      toValue: 1,
      duration: 160,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [enter, lines]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(nudge, { toValue: 1, duration: 620, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
        Animated.timing(nudge, { toValue: 0, duration: 620, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [nudge]);

  const translateY = enter.interpolate({ inputRange: [0, 1], outputRange: [14, 0] });
  const caretY = nudge.interpolate({ inputRange: [0, 1], outputRange: [0, 4] });

  return (
    <Pressable
      testID="battle-message"
      accessibilityRole="button"
      accessibilityLabel={`${lines.join(" ")}. Tap to continue.`}
      onPress={onAdvance}
      style={styles.catcher}
    >
      <Animated.View
        style={[
          styles.box,
          emphasis === "good" && styles.boxGood,
          emphasis === "bad" && styles.boxBad,
          { opacity: enter, transform: [{ translateY }] },
        ]}
      >
        {lines.map((line, i) => (
          <Text key={`${line}-${i}`} style={[styles.line, i === 0 && styles.lead]}>
            {line}
          </Text>
        ))}
        <View style={styles.footer}>
          <Text style={styles.hint}>{remaining > 0 ? `Tap to continue · ${remaining} more` : "Tap to continue"}</Text>
          <Animated.Text style={[styles.caret, { transform: [{ translateY: caretY }] }]}>▼</Animated.Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Fills the action area so a tap anywhere below the creatures advances — on a phone you
  // should not have to aim for the box itself.
  catcher: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    padding: 12,
  },
  box: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    gap: 4,
    shadowColor: colors.shadow,
    shadowOpacity: 1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  boxGood: { borderColor: "#5aa845" },
  boxBad: { borderColor: "#c04a3a" },
  line: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 21,
  },
  lead: {
    fontWeight: "700",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 6,
    marginTop: 4,
  },
  hint: {
    color: colors.textMuted,
    fontSize: 11,
  },
  caret: {
    color: colors.accent,
    fontSize: 12,
  },
});
