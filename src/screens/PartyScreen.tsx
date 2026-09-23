import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Animated,
  Easing,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { useGameStore } from "../state/gameStore";
import { partyMemberStats } from "../game/party";
import { dropIndex, shiftFor, type Slot } from "../game/reorder";
import { useItemFlow } from "./components/useItemFlow";
import { HpBar } from "./components/HpBar";
import { TypeBadge } from "./components/TypeBadge";
import { CreatureAvatar } from "./components/CreatureAvatar";
import { PrimaryButton } from "./components/PrimaryButton";
import { ScreenBackground } from "./components/ScreenBackground";
import { useKeyboardShortcuts } from "./components/useKeyboardShortcuts";
import { colors } from "./theme";
import { useI18n } from "../i18n";

type Props = NativeStackScreenProps<RootStackParamList, "Party">;

/** Space between cards, matching styles.list's gap — a dragged card moves aside by its height plus this. */
const CARD_GAP = 12;

export function PartyScreen({ navigation }: Props) {
  const party = useGameStore((s) => s.party);
  const releaseCreature = useGameStore((s) => s.releaseCreature);
  const reorderParty = useGameStore((s) => s.reorderParty);
  const [confirmUid, setConfirmUid] = useState<string | null>(null);
  const { t } = useI18n();
  const itemFlow = useItemFlow();

  useKeyboardShortcuts({ m: () => navigation.popToTop() });

  // Drag and drop. Each card reports where it sits; while one is held, the others slide aside
  // to show where it would land, and letting go commits the new order.
  const slots = useRef<Slot[]>([]);
  const [drag, setDrag] = useState<{ from: number; to: number } | null>(null);
  const dragRef = useRef(drag);
  dragRef.current = drag;
  const dragY = useRef(new Animated.Value(0)).current;

  const dragHandlers = {
    start: (index: number) => {
      dragY.setValue(0);
      setConfirmUid(null);
      setDrag({ from: index, to: index });
    },
    move: (dy: number) => {
      const current = dragRef.current;
      if (!current) return;
      dragY.setValue(dy);
      const to = dropIndex(slots.current, current.from, dy);
      if (to !== current.to) setDrag({ from: current.from, to });
    },
    end: () => {
      const current = dragRef.current;
      setDrag(null);
      dragY.setValue(0);
      if (current && current.to !== current.from) reorderParty(current.from, current.to);
    },
    step: (index: number, by: -1 | 1) => reorderParty(index, index + by),
  };

  // The first creature still able to fight is the one that leads — normally the top card.
  const leadIndex = party.findIndex((m) => m.currentHp > 0);
  const draggedHeight = drag ? (slots.current[drag.from]?.height ?? 0) + CARD_GAP : 0;

  return (
    <ScreenBackground style={styles.container}>
      <Text style={styles.title}>{t("party.title")}</Text>
      <Text style={styles.subtitle}>{t("party.subtitle", { count: party.length })}</Text>

      <ScrollView scrollEnabled={!drag} contentContainerStyle={styles.list}>
        {party.map((member, index) => {
          const fainted = member.currentHp <= 0;
          const confirming = confirmUid === member.uid;
          const dragging = drag?.from === index;
          const shift = drag && !dragging ? shiftFor(index, drag.from, drag.to, draggedHeight) : 0;
          return (
            <SlidingCard
              key={member.uid}
              shift={shift}
              dragY={dragging ? dragY : null}
              onLayout={(e) => {
                const { y, height } = e.nativeEvent.layout;
                slots.current[index] = { y, height };
              }}
              style={[styles.card, fainted && styles.cardFainted, dragging && styles.cardDragging]}
            >
              <View style={styles.cardTopRow}>
                <DragHandle
                  index={index}
                  count={party.length}
                  label={t("party.dragHandle", { name: member.displayName })}
                  handlers={dragHandlers}
                />
                <Pressable
                  testID={`party-member-${member.uid}`}
                  onPress={() => navigation.navigate("CreatureDetail", { source: "party", uid: member.uid })}
                  style={({ pressed }) => [styles.cardMain, pressed && styles.cardPressed]}
                >
                  <CreatureAvatar speciesId={member.speciesId} types={member.types} size={56} faded={fainted} />
                  <View style={styles.cardInfo}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.slotIndex}>#{index + 1}</Text>
                      <Text style={styles.name}>
                        {member.displayName} <Text style={styles.level}>{t("common.level", { level: member.level })}</Text>
                      </Text>
                      {index === leadIndex && <Text style={styles.mainTag}>{t("party.main")}</Text>}
                      {fainted && <Text style={styles.faintedTag}>{t("common.fainted")}</Text>}
                    </View>
                    <View style={styles.badgeRow}>
                      {member.types.map((type) => (
                        <TypeBadge key={type} type={type} />
                      ))}
                    </View>
                    <HpBar currentHp={member.currentHp} maxHp={partyMemberStats(member).hp} />
                  </View>
                </Pressable>
              </View>

              {confirming ? (
                <View style={styles.releaseConfirmRow}>
                  <Text style={styles.releaseConfirmText}>{t("party.releaseConfirm", { name: member.displayName })}</Text>
                  <View style={styles.releaseConfirmButtons}>
                    <Pressable
                      testID={`confirm-release-${member.uid}`}
                      onPress={() => {
                        releaseCreature(member.uid);
                        setConfirmUid(null);
                      }}
                      style={styles.releaseConfirmBtn}
                    >
                      <Text style={styles.releaseConfirmBtnText}>{t("common.yesRelease")}</Text>
                    </Pressable>
                    <Pressable
                      testID={`cancel-release-${member.uid}`}
                      onPress={() => setConfirmUid(null)}
                      style={styles.releaseCancelBtn}
                    >
                      <Text style={styles.releaseCancelBtnText}>{t("common.cancel")}</Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <View style={styles.actionRow}>
                  {itemFlow.hasUsableItems && (
                    <Pressable
                      testID={`party-use-item-${member.uid}`}
                      onPress={() => itemFlow.chooseItemFor(member.uid)}
                      style={styles.useItemButton}
                    >
                      <Text style={styles.useItemButtonText}>{t("party.useItem")}</Text>
                    </Pressable>
                  )}
                  {party.length > 1 && (
                    <Pressable
                      testID={`release-${member.uid}`}
                      onPress={() => setConfirmUid(member.uid)}
                      style={styles.releaseButton}
                    >
                      <Text style={styles.releaseButtonText}>{t("party.release")}</Text>
                    </Pressable>
                  )}
                </View>
              )}
            </SlidingCard>
          );
        })}
        {party.length === 0 && <Text style={styles.empty}>{t("party.empty")}</Text>}
      </ScrollView>

      {itemFlow.feedback && (
        <Text testID="party-feedback" style={styles.feedback}>
          {itemFlow.feedback}
        </Text>
      )}
      <PrimaryButton testID="back-button" label={t("common.back")} variant="secondary" onPress={() => navigation.goBack()} />
      {itemFlow.overlays}
    </ScreenBackground>
  );
}

/**
 * One card in the list. The held card follows the pointer (dragY); the rest glide to their
 * `shift` so the gap opens where the held card would land.
 */
function SlidingCard({
  shift,
  dragY,
  onLayout,
  style,
  children,
}: {
  shift: number;
  dragY: Animated.Value | null;
  onLayout: (e: LayoutChangeEvent) => void;
  style: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  const offset = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(offset, { toValue: shift, duration: 140, easing: Easing.out(Easing.quad), useNativeDriver: false }).start();
  }, [offset, shift]);
  // Snap back to rest the moment the list re-orders, rather than gliding from the old gap.
  useEffect(() => {
    if (shift === 0) offset.setValue(0);
  }, [offset, shift]);

  return (
    <Animated.View
      onLayout={onLayout}
      style={[style, { transform: [{ translateY: dragY ?? offset }] }, dragY ? styles.lifted : null]}
    >
      {children}
    </Animated.View>
  );
}

/**
 * The grip on each card. Pressing and dragging it moves the card; screen readers get
 * "move up" and "move down" actions instead of having to drag.
 */
function DragHandle({
  index,
  count,
  label,
  handlers,
}: {
  index: number;
  count: number;
  label: string;
  handlers: {
    start: (index: number) => void;
    move: (dy: number) => void;
    end: () => void;
    step: (index: number, by: -1 | 1) => void;
  };
}) {
  const indexRef = useRef(index);
  indexRef.current = index;
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      // Keep hold of the gesture — the list must not scroll away with the card mid-drag.
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => handlersRef.current.start(indexRef.current),
      onPanResponderMove: (_e, gesture) => handlersRef.current.move(gesture.dy),
      onPanResponderRelease: () => handlersRef.current.end(),
      onPanResponderTerminate: () => handlersRef.current.end(),
    })
  ).current;

  return (
    <View
      testID={`drag-handle-${index}`}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityActions={[
        { name: "decrement", label: "Move up" },
        { name: "increment", label: "Move down" },
      ]}
      onAccessibilityAction={(event) => {
        if (event.nativeEvent.actionName === "decrement" && index > 0) handlers.step(index, -1);
        if (event.nativeEvent.actionName === "increment" && index < count - 1) handlers.step(index, 1);
      }}
      style={[styles.handle, Platform.OS === "web" && (styles.handleWeb as ViewStyle)]}
      {...responder.panHandlers}
    >
      <View style={styles.gripLine} />
      <View style={styles.gripLine} />
      <View style={styles.gripLine} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 24,
    gap: 4,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "700",
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: 8,
  },
  list: {
    gap: CARD_GAP,
    paddingVertical: 8,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 8,
  },
  cardPressed: {
    opacity: 0.8,
  },
  cardFainted: {
    opacity: 0.55,
  },
  faintedTag: {
    color: colors.danger,
    fontSize: 11,
    fontWeight: "700",
    marginLeft: "auto",
  },
  mainTag: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: "700",
    marginLeft: "auto",
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cardInfo: {
    flex: 1,
    gap: 8,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  slotIndex: {
    color: colors.textMuted,
    fontSize: 12,
  },
  name: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "700",
  },
  level: {
    color: colors.textMuted,
    fontWeight: "400",
    fontSize: 13,
  },
  badgeRow: {
    flexDirection: "row",
  },
  empty: {
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 40,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 4,
  },
  useItemButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  useItemButtonText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: "700",
  },
  cardMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cardDragging: {
    borderColor: colors.accent,
  },
  lifted: {
    zIndex: 10,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  handle: {
    width: 36,
    alignSelf: "stretch",
    minHeight: 56,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    marginLeft: -6,
    borderRadius: 10,
    backgroundColor: colors.surfaceAlt,
  },
  handleWeb: {
    cursor: "grab",
    touchAction: "none",
    userSelect: "none",
  } as unknown as ViewStyle,
  gripLine: {
    width: 16,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.textMuted,
  },
  feedback: {
    color: colors.text,
    fontSize: 13,
    textAlign: "center",
    backgroundColor: colors.surfaceAlt,
    borderRadius: 10,
    padding: 10,
  },
  releaseButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  releaseButtonText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: "700",
  },
  releaseConfirmRow: {
    marginTop: 8,
    gap: 8,
  },
  releaseConfirmText: {
    color: colors.text,
    fontSize: 13,
  },
  releaseConfirmButtons: {
    flexDirection: "row",
    gap: 10,
  },
  releaseConfirmBtn: {
    backgroundColor: colors.danger,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  releaseConfirmBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  releaseCancelBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  releaseCancelBtnText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
});
