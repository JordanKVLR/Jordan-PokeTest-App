import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import type { BriefingPage } from "../../game/briefings";
import { colors } from "../theme";

/**
 * A stack of briefing pages, one at a time, each tapped away — the same rule the battle
 * messages follow. The last page's button says "Let's go" rather than "Next" so the player
 * knows which tap hands control back to them.
 */
export function BriefingModal({ pages, onDone }: { pages: BriefingPage[]; onDone: () => void }) {
  const [index, setIndex] = useState(0);
  const enter = useRef(new Animated.Value(0)).current;
  const page = pages[index];

  useEffect(() => {
    enter.setValue(0);
    Animated.timing(enter, { toValue: 1, duration: 240, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [enter, index]);

  if (!page) return null;
  const last = index === pages.length - 1;
  const advance = () => (last ? onDone() : setIndex(index + 1));

  return (
    <Modal visible transparent animationType="fade" onRequestClose={advance}>
      <Pressable testID="briefing-backdrop" style={styles.backdrop} onPress={advance}>
        <Animated.View
          testID={`briefing-${page.id}`}
          style={[
            styles.card,
            {
              opacity: enter,
              transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }],
            },
          ]}
        >
          <Text style={styles.kicker}>{page.kicker}</Text>
          <Text style={styles.title}>{page.title}</Text>
          <View style={styles.body}>
            {page.lines.map((line) => (
              <Text key={line} style={styles.line}>
                {line}
              </Text>
            ))}
          </View>
          <View style={styles.footer}>
            {pages.length > 1 && (
              <Text style={styles.count}>
                {index + 1} / {pages.length}
              </Text>
            )}
            <Pressable
              testID="briefing-continue"
              onPress={advance}
              style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
            >
              <Text style={styles.buttonText}>{last ? "Let's go" : "Next"}</Text>
            </Pressable>
          </View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(12, 24, 32, 0.55)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 440,
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 22,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  kicker: {
    color: colors.accentDeep,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "800",
    marginTop: 4,
  },
  body: {
    marginTop: 12,
    gap: 10,
  },
  line: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
  },
  footer: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 14,
  },
  count: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  button: {
    backgroundColor: colors.accent,
    paddingVertical: 11,
    paddingHorizontal: 24,
    borderRadius: 999,
  },
  buttonPressed: {
    backgroundColor: colors.accentDeep,
    transform: [{ scale: 0.97 }],
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
  },
});
