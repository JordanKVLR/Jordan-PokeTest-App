import { useEffect, useRef } from "react";
import { Animated, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { getMove } from "../../game/movesRepo";
import { TypeBadge } from "./TypeBadge";
import { colors } from "../theme";

export interface MoveLearnPrompt {
  /** Who is learning. */
  uid: string;
  displayName: string;
  /** The move on offer. */
  newMoveId: string;
  /** The four moves already known, one of which must go. */
  currentMoveIds: string[];
}

/**
 * Shown when a creature levels into a move but already knows four. The player either picks
 * one to forget or declines — nothing is overwritten silently, since a moveset is one of the
 * few things the player has deliberately shaped.
 */
export function MoveLearnModal({
  prompt,
  onReplace,
  onSkip,
}: {
  prompt: MoveLearnPrompt;
  onReplace: (forgetMoveId: string) => void;
  onSkip: () => void;
}) {
  const newMove = getMove(prompt.newMoveId);
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: false }),
        Animated.timing(pulse, { toValue: 0, duration: 900, useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const glow = pulse.interpolate({ inputRange: [0, 1], outputRange: [colors.accent, colors.accentDeep] });

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onSkip}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{prompt.displayName} wants to learn</Text>

          <Animated.View style={[styles.newMoveCard, { borderColor: glow }]}>
            <View style={styles.moveRow}>
              <Text style={styles.newMoveName}>{newMove.name}</Text>
              <TypeBadge type={newMove.type} />
            </View>
            <Text style={styles.moveMeta}>
              {newMove.category === "status" ? "Status" : `${newMove.power} power`} · {newMove.accuracy}% · {newMove.pp} PP
            </Text>
          </Animated.View>

          <Text style={styles.prompt}>
            But it already knows four moves. Choose one to forget, or keep the current set.
          </Text>

          {prompt.currentMoveIds.map((moveId) => {
            const move = getMove(moveId);
            return (
              <Pressable
                key={moveId}
                testID={`forget-move-${moveId}`}
                onPress={() => onReplace(moveId)}
                style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
              >
                <View style={styles.moveRow}>
                  <Text style={styles.optionName}>{move.name}</Text>
                  <TypeBadge type={move.type} />
                </View>
                <Text style={styles.moveMeta}>
                  {move.category === "status" ? "Status" : `${move.power} power`} · {move.accuracy}% · {move.pp} PP
                </Text>
              </Pressable>
            );
          })}

          <Pressable testID="skip-move-learn" onPress={onSkip} style={styles.skip}>
            <Text style={styles.skipText}>Don't learn {newMove.name}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.scrim,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 20,
    gap: 10,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  newMoveCard: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 12,
    backgroundColor: colors.surfaceAlt,
    gap: 4,
  },
  newMoveName: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "700",
  },
  prompt: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: "center",
    marginTop: 2,
  },
  option: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  optionPressed: {
    backgroundColor: colors.surfaceAlt,
    transform: [{ scale: 0.99 }],
  },
  optionName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
  },
  moveRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  moveMeta: {
    color: colors.textMuted,
    fontSize: 11,
  },
  skip: {
    marginTop: 4,
    alignItems: "center",
    paddingVertical: 10,
  },
  skipText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "700",
  },
});
