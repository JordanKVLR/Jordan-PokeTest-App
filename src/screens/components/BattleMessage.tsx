import { useEffect, useRef } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme";
import { useI18n } from "../../i18n";

/**
 * The battle's dialogue box: one beat of the fight.
 *
 * Whether it waits for a tap or moves on by itself is the Battle pace setting, decided by the
 * caller and passed in as autoAdvanceMs. When it will move on, a bar drains along the bottom
 * so the player can see how long they have — and a tap always skips ahead early either way.
 *
 * It sits over the action buttons rather than the creatures, so the thing the text is talking
 * about is still visible while you read about it.
 */
export function BattleMessage({
  lines,
  emphasis,
  onAdvance,
  remaining,
  autoAdvanceMs = null,
  large = false,
}: {
  lines: string[];
  /** Draws the eye to the beat that changed the fight — a big hit, a faint, a medal. */
  emphasis?: "none" | "good" | "bad";
  onAdvance: () => void;
  /** How many more popups are queued behind this one, for the "keep tapping" hint. */
  remaining: number;
  /** Move on by itself after this long, or null to wait for a tap. */
  autoAdvanceMs?: number | null;
  /** Larger text, from the Message text size setting. */
  large?: boolean;
}) {
  const { t } = useI18n();
  const enter = useRef(new Animated.Value(0)).current;
  const nudge = useRef(new Animated.Value(0)).current;
  const drain = useRef(new Animated.Value(1)).current;
  // Mounted fresh for every popup (the caller keys it by id), so this guard is per message:
  // a tap landing in the same frame as the timer still advances exactly once.
  const doneRef = useRef(false);
  const onAdvanceRef = useRef(onAdvance);
  onAdvanceRef.current = onAdvance;
  const advance = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    onAdvanceRef.current();
  };

  useEffect(() => {
    if (autoAdvanceMs === null) return;
    drain.setValue(1);
    Animated.timing(drain, { toValue: 0, duration: autoAdvanceMs, easing: Easing.linear, useNativeDriver: false }).start();
    const timer = setTimeout(advance, autoAdvanceMs);
    return () => clearTimeout(timer);
    // Once per popup: the component is remounted for the next one.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      accessibilityLabel={`${lines.join(" ")}. ${t("common.tapToContinue")}.`}
      onPress={advance}
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
          <Text key={`${line}-${i}`} style={[styles.line, large && styles.lineLarge, i === 0 && styles.lead]}>
            {line}
          </Text>
        ))}
        <View style={styles.footer}>
          <Text style={styles.hint}>
            {autoAdvanceMs !== null
              ? t("common.tapToSkip")
              : remaining > 0
                ? t("common.tapToContinueMore", { count: remaining })
                : t("common.tapToContinue")}
          </Text>
          <Animated.Text style={[styles.caret, { transform: [{ translateY: caretY }] }]}>▼</Animated.Text>
        </View>
        {autoAdvanceMs !== null && (
          <View testID="battle-message-timer" style={styles.timerTrack}>
            <Animated.View
              style={[styles.timerFill, { width: drain.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }) }]}
            />
          </View>
        )}
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
  lineLarge: {
    fontSize: 18,
    lineHeight: 25,
  },
  timerTrack: {
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.surfaceAlt,
    overflow: "hidden",
    marginTop: 6,
  },
  timerFill: {
    height: 3,
    backgroundColor: colors.accent,
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
