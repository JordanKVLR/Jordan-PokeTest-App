import { useState, type ReactNode } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useGameStore } from "../../state/gameStore";
import { partyMemberStats } from "../../game/party";
import { usableItems } from "../../game/itemsRepo";
import type { ItemData } from "../../data/schemas";
import { useI18n } from "../../i18n";
import { HpBar } from "./HpBar";
import { CreatureAvatar } from "./CreatureAvatar";
import { PrimaryButton } from "./PrimaryButton";
import { LevelUpModal, type LevelUpRevealData } from "./LevelUpModal";
import { EvolutionModal, type EvolutionRevealData } from "./EvolutionModal";
import { MoveLearnModal, type MoveLearnPrompt } from "./MoveLearnModal";
import { colors } from "../theme";
import { battle as battleSfx } from "../../audio/sfx";

/**
 * Using a Bag item on a party member, from wherever the player happens to be: the Bag, the
 * Party list or a creature's own page. Each of those starts from a different end — an item
 * looking for a creature, or a creature looking for an item — but what follows is the same:
 * the item is spent, and a Kinnie may bring a level-up screen, an evolution and a move to learn.
 *
 * Returns the functions that open each kind of picker, the latest one-line result for the
 * caller to show, and the overlays to render.
 */
export function useItemFlow() {
  const { t, c } = useI18n();
  const party = useGameStore((s) => s.party);
  const inventory = useGameStore((s) => s.inventory);
  const useItemOnPartyMember = useGameStore((s) => s.useItemOnPartyMember);
  const replacePartyMemberMove = useGameStore((s) => s.replacePartyMemberMove);

  const [pickCreatureFor, setPickCreatureFor] = useState<string | null>(null);
  const [pickItemFor, setPickItemFor] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [levelUpReveal, setLevelUpReveal] = useState<LevelUpRevealData | null>(null);
  const [evolutionReveal, setEvolutionReveal] = useState<EvolutionRevealData | null>(null);
  const [movePrompts, setMovePrompts] = useState<MoveLearnPrompt[]>([]);

  const ownedUsable = usableItems().filter((item) => (inventory[item.id] ?? 0) > 0);

  /** Why this item can't go on this creature right now, or null if it can. */
  function blockedReason(item: ItemData, uid: string): string | null {
    const member = party.find((m) => m.uid === uid);
    if (!member) return null;
    if (item.effect === "heal" && member.currentHp >= partyMemberStats(member).hp) return t("items.fullHp");
    return null;
  }

  function apply(uid: string, itemId: string) {
    const member = party.find((m) => m.uid === uid);
    if (!member) return;
    const oldStats = partyMemberStats(member);
    const oldLevel = member.level;
    const itemName = c.item(itemId);
    const result = useItemOnPartyMember(uid, itemId);
    setPickCreatureFor(null);
    setPickItemFor(null);
    if (!result.applied) return;

    if (result.effect === "heal") {
      battleSfx.heal();
      setFeedback(t("detail.healed", { name: member.displayName, item: itemName, amount: result.healedAmount }));
      return;
    }

    const leveled = result.member;
    for (const moveId of result.moveLearning.learned) {
      setFeedback(t("battle.learned", { name: leveled.displayName, move: c.move(moveId) }));
    }
    if (result.moveLearning.pending.length > 0) {
      setMovePrompts(
        result.moveLearning.pending.map((moveId) => ({
          uid: leveled.uid,
          displayName: leveled.displayName,
          newMoveId: moveId,
          currentMoveIds: leveled.moveIds,
        }))
      );
    }
    if (result.evolution) {
      setFeedback(t("evolve.done", { old: result.evolution.oldDisplayName, new: result.evolution.newDisplayName }));
      setEvolutionReveal(result.evolution);
    } else {
      setFeedback(t("detail.grew", { name: member.displayName, item: itemName, level: leveled.level }));
    }
    setLevelUpReveal({
      speciesId: leveled.speciesId,
      types: leveled.types,
      displayName: leveled.displayName,
      oldLevel,
      newLevel: leveled.level,
      oldStats,
      newStats: partyMemberStats(leveled),
    });
  }

  const itemForCreature = pickCreatureFor ? ownedUsable.find((item) => item.id === pickCreatureFor) : undefined;
  const creatureForItem = pickItemFor ? party.find((m) => m.uid === pickItemFor) : undefined;

  const overlays: ReactNode = (
    <>
      <Modal visible={!!itemForCreature} transparent animationType="none" onRequestClose={() => setPickCreatureFor(null)}>
        <Pressable testID="item-sheet-backdrop" style={styles.backdrop} onPress={() => setPickCreatureFor(null)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            {itemForCreature && (
              <>
                <Text style={styles.title}>{t("items.useOn", { item: c.item(itemForCreature.id) })}</Text>
                <Text style={styles.note}>
                  {c.itemDescription(itemForCreature.id)} · {t("items.left", { count: inventory[itemForCreature.id] ?? 0 })}
                </Text>
                <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
                  {party.map((member) => {
                    const blocked = blockedReason(itemForCreature, member.uid);
                    return (
                      <Pressable
                        key={member.uid}
                        testID={`use-on-${member.uid}`}
                        disabled={!!blocked}
                        onPress={() => apply(member.uid, itemForCreature.id)}
                        style={({ pressed }) => [styles.row, blocked && styles.rowDisabled, pressed && styles.rowPressed]}
                      >
                        <CreatureAvatar speciesId={member.speciesId} types={member.types} size={40} faded={member.currentHp <= 0} />
                        <View style={styles.rowBody}>
                          <Text style={styles.rowTitle}>
                            {member.displayName} <Text style={styles.rowMeta}>{t("common.level", { level: member.level })}</Text>
                          </Text>
                          <HpBar currentHp={member.currentHp} maxHp={partyMemberStats(member).hp} />
                        </View>
                        {blocked && <Text style={styles.rowMeta}>{blocked}</Text>}
                      </Pressable>
                    );
                  })}
                </ScrollView>
                <PrimaryButton label={t("common.close")} variant="secondary" onPress={() => setPickCreatureFor(null)} />
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={!!creatureForItem} transparent animationType="none" onRequestClose={() => setPickItemFor(null)}>
        <Pressable testID="item-sheet-backdrop" style={styles.backdrop} onPress={() => setPickItemFor(null)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            {creatureForItem && (
              <>
                <Text style={styles.title}>{t("items.useItemOn", { name: creatureForItem.displayName })}</Text>
                <HpBar currentHp={creatureForItem.currentHp} maxHp={partyMemberStats(creatureForItem).hp} />
                <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
                  {ownedUsable.map((item) => {
                    const blocked = blockedReason(item, creatureForItem.uid);
                    return (
                      <Pressable
                        key={item.id}
                        testID={`detail-use-item-${item.id}`}
                        disabled={!!blocked}
                        onPress={() => apply(creatureForItem.uid, item.id)}
                        style={({ pressed }) => [styles.row, blocked && styles.rowDisabled, pressed && styles.rowPressed]}
                      >
                        <View style={styles.rowBody}>
                          <Text style={styles.rowTitle}>
                            {c.item(item.id)} <Text style={styles.rowMeta}>x{inventory[item.id] ?? 0}</Text>
                          </Text>
                          <Text style={styles.rowMeta}>{c.itemDescription(item.id)}</Text>
                        </View>
                        <Text style={styles.rowMeta}>
                          {blocked ??
                            (item.effect === "heal" ? t("common.healPlus", { amount: item.healAmount ?? 0 }) : t("common.levelPlus"))}
                        </Text>
                      </Pressable>
                    );
                  })}
                  {ownedUsable.length === 0 && <Text style={styles.note}>{t("detail.noItems")}</Text>}
                </ScrollView>
                <PrimaryButton label={t("common.close")} variant="secondary" onPress={() => setPickItemFor(null)} />
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {evolutionReveal ? (
        <EvolutionModal data={evolutionReveal} onDismiss={() => setEvolutionReveal(null)} />
      ) : levelUpReveal ? (
        <LevelUpModal data={levelUpReveal} onDismiss={() => setLevelUpReveal(null)} />
      ) : (
        movePrompts.length > 0 && (
          <MoveLearnModal
            prompt={movePrompts[0]}
            onReplace={(forgetMoveId) => {
              const prompt = movePrompts[0];
              replacePartyMemberMove(prompt.uid, forgetMoveId, prompt.newMoveId);
              setFeedback(
                t("battle.forgotLearned", { name: prompt.displayName, old: c.move(forgetMoveId), new: c.move(prompt.newMoveId) })
              );
              setMovePrompts((prev) => prev.slice(1));
            }}
            onSkip={() => setMovePrompts((prev) => prev.slice(1))}
          />
        )
      )}
    </>
  );

  return {
    /** Starting from an item (the Bag): choose which creature it goes on. */
    chooseCreatureFor: (itemId: string) => {
      setFeedback(null);
      setPickCreatureFor(itemId);
    },
    /** Starting from a creature (Party, its own page): choose which item to use on it. */
    chooseItemFor: (uid: string) => {
      setFeedback(null);
      setPickItemFor(uid);
    },
    /** Whether the player owns anything they could use outside battle. */
    hasUsableItems: ownedUsable.length > 0,
    feedback,
    clearFeedback: () => setFeedback(null),
    overlays,
  };
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    gap: 10,
    maxHeight: "80%",
    width: "100%",
    maxWidth: 640,
    alignSelf: "center",
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  note: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
  },
  list: {
    flexGrow: 0,
  },
  listContent: {
    gap: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 10,
    borderRadius: 12,
    backgroundColor: colors.surfaceAlt,
  },
  rowPressed: {
    opacity: 0.75,
  },
  rowDisabled: {
    opacity: 0.45,
  },
  rowBody: {
    flex: 1,
    gap: 4,
  },
  rowTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  rowMeta: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "400",
  },
});
