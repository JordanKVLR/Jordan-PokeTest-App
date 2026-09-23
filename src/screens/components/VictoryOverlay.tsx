import { useEffect, useRef } from "react";
import { Animated, Easing, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme";
import { useTapAnywhere } from "./useTapAnywhere";
import { useI18n } from "../../i18n";

/**
 * The end of the run. Shown once — the moment the last trainer on the islands goes down and
 * every medal is already in hand.
 *
 * Deliberately a different shape to the blackout: that one fades to nothing, this one builds
 * up. The star rises, the text arrives after it, and the whole thing sits on gold rather than
 * on black.
 */
export function VictoryOverlay({
  trainersBeaten,
  medalsWon,
  onContinue,
}: {
  trainersBeaten: number;
  medalsWon: number;
  onContinue: () => void;
}) {
  const { t } = useI18n();
  const tapAnywhere = useTapAnywhere(onContinue);
  const rise = useRef(new Animated.Value(0)).current;
  const textFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(rise, { toValue: 1, duration: 700, easing: Easing.out(Easing.back(2)), useNativeDriver: false }),
      Animated.timing(textFade, { toValue: 1, duration: 600, useNativeDriver: false }),
    ]).start();
  }, [rise, textFade]);

  const starScale = rise.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] });

  return (
    <Modal visible transparent animationType="fade" onRequestClose={() => {}}>
      <View testID="victory-overlay" style={styles.backdrop}>
        <Pressable testID="victory-backdrop" accessibilityRole="button" onPress={tapAnywhere} style={StyleSheet.absoluteFill} />
        <Animated.Text style={[styles.star, { transform: [{ scale: starScale }] }]}>★</Animated.Text>
        <Animated.View pointerEvents="box-none" style={{ opacity: textFade, alignItems: "center" }}>
          <Text style={styles.title}>{t("victory.title")}</Text>
          <Text style={styles.body}>{t("victory.body", { trainers: trainersBeaten, medals: medalsWon })}</Text>
          <Pressable
            testID="victory-continue"
            onPress={tapAnywhere}
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          >
            <Text style={styles.buttonText}>{t("victory.keepPlaying")}</Text>
          </Pressable>
          <Text style={styles.hint}>{t("common.tapAnywhere")}</Text>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  hint: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    marginTop: 14,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(38, 26, 8, 0.94)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  star: {
    fontSize: 72,
    color: colors.accent,
    marginBottom: 12,
  },
  title: {
    color: "#fdf6e6",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },
  body: {
    color: "#e0cfa8",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 28,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.accent,
    backgroundColor: "rgba(239, 159, 46, 0.18)",
  },
  buttonPressed: {
    backgroundColor: "rgba(239, 159, 46, 0.34)",
    transform: [{ scale: 0.97 }],
  },
  buttonText: {
    color: "#fdf6e6",
    fontSize: 15,
    fontWeight: "700",
  },
});
