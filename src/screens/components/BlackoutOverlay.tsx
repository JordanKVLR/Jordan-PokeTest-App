import { useEffect, useRef } from "react";
import { Animated, Modal, Pressable, StyleSheet, Text } from "react-native";
import { useTapAnywhere } from "./useTapAnywhere";
import { useI18n } from "../../i18n";

/**
 * The classic whiteout, in black: when the last creature goes down, the screen fades out
 * rather than dropping straight into a result box. The fade is the punishment — you lose
 * your place on the road and wake back at the chapel — so it gets its own beat instead of
 * being one more line in the battle log.
 */
export function BlackoutOverlay({
  zoneName,
  onContinue,
}: {
  zoneName: string;
  onContinue: () => void;
}) {
  const { t } = useI18n();
  const tapAnywhere = useTapAnywhere(onContinue);
  const fade = useRef(new Animated.Value(0)).current;
  const textFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(fade, { toValue: 1, duration: 900, useNativeDriver: false }),
      Animated.timing(textFade, { toValue: 1, duration: 500, useNativeDriver: false }),
    ]).start();
  }, [fade, textFade]);

  return (
    <Modal visible transparent animationType="none" onRequestClose={() => {}}>
      <Animated.View testID="blackout-overlay" style={[styles.backdrop, { opacity: fade }]}>
        <Pressable testID="blackout-backdrop" accessibilityRole="button" onPress={tapAnywhere} style={StyleSheet.absoluteFill} />
        <Animated.View pointerEvents="box-none" style={{ opacity: textFade, alignItems: "center" }}>
          <Text style={styles.title}>{t("blackout.title")}</Text>
          <Text style={styles.body}>{t("blackout.body", { zone: zoneName })}</Text>
          <Pressable
            testID="blackout-continue"
            onPress={tapAnywhere}
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          >
            <Text style={styles.buttonText}>{t("blackout.wake")}</Text>
          </Pressable>
          <Text style={styles.hint}>{t("common.tapAnywhere")}</Text>
        </Animated.View>
      </Animated.View>
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
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  title: {
    color: "#f2f2f2",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },
  body: {
    color: "#a9a9a9",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 28,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#6b6b6b",
  },
  buttonPressed: {
    backgroundColor: "#1c1c1c",
    transform: [{ scale: 0.97 }],
  },
  buttonText: {
    color: "#f2f2f2",
    fontSize: 15,
    fontWeight: "700",
  },
});
