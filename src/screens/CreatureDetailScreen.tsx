import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { useGameStore } from "../state/gameStore";
import { evolutionLinks, getDexEntry } from "../game/speciesCatalog";
import { getMove } from "../game/movesRepo";
import { partyMemberStats, remainingPp } from "../game/party";
import { xpToNextLevel } from "../game/progression";
import type { StatBlock } from "../data/schemas";
import { HpBar } from "./components/HpBar";
import { TypeBadge } from "./components/TypeBadge";
import { CreatureAvatar } from "./components/CreatureAvatar";
import { PrimaryButton } from "./components/PrimaryButton";
import { ScreenBackground } from "./components/ScreenBackground";
import { useKeyboardShortcuts } from "./components/useKeyboardShortcuts";
import { MoveDetailCard } from "./components/MoveDetailCard";
import { useItemFlow } from "./components/useItemFlow";
import { useI18n } from "../i18n";
import { colors } from "./theme";

type Props = NativeStackScreenProps<RootStackParamList, "CreatureDetail">;

const STAT_KEYS: (keyof StatBlock)[] = ["hp", "atk", "def", "spatk", "spdef", "speed"];

/** Reference ceiling for the stat bars — Melita's base stats top out well under this. */
const STAT_BAR_MAX = 180;

function StatBar({ label, value }: { label: string; value: number }) {
  const ratio = Math.max(0, Math.min(1, value / STAT_BAR_MAX));
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <View style={styles.statBarTrack}>
        <View style={[styles.statBarFill, { width: `${ratio * 100}%` }]} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

/**
 * Where this creature sits in its line. A form the player has never met stays a mystery, the
 * same as it is in the Codex, so the page doesn't spoil what a starter turns into.
 */
function EvolutionSection({
  speciesId,
  known,
  onOpen,
}: {
  speciesId: string;
  known: (speciesId: string) => boolean;
  onOpen: (speciesId: string) => void;
}) {
  const { t } = useI18n();
  const { from, into } = evolutionLinks(speciesId);
  const link = (target: { speciesId: string; name: string; level: number }, key: "detail.evolvesFrom" | "detail.evolvesInto") => {
    const isKnown = known(target.speciesId);
    const label = t(key, { name: isKnown ? target.name : t("detail.unknownForm"), level: target.level });
    return isKnown ? (
      <Pressable testID={`evolution-${target.speciesId}`} onPress={() => onOpen(target.speciesId)}>
        <Text style={[styles.flavorText, styles.linkText]}>{label} ›</Text>
      </Pressable>
    ) : (
      <Text style={styles.flavorText}>{label}</Text>
    );
  };
  return (
    <View style={styles.section} testID="evolution-section">
      <Text style={styles.sectionTitle}>{t("detail.evolution")}</Text>
      {from && link(from, "detail.evolvesFrom")}
      {into ? link(into, "detail.evolvesInto") : <Text style={styles.flavorText}>{t("detail.finalForm")}</Text>}
    </View>
  );
}

export function CreatureDetailScreen({ route, navigation }: Props) {
  const params = route.params;
  const party = useGameStore((s) => s.party);
  const caughtSpeciesIds = useGameStore((s) => s.caughtSpeciesIds);
  const seenSpeciesIds = useGameStore((s) => s.seenSpeciesIds);
  const releaseCreature = useGameStore((s) => s.releaseCreature);
  const renamePartyMember = useGameStore((s) => s.renamePartyMember);
  const [confirmingRelease, setConfirmingRelease] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [openMoveId, setOpenMoveId] = useState<string | null>(null);
  const itemFlow = useItemFlow();
  const { t, c } = useI18n();

  useKeyboardShortcuts({ m: () => navigation.popToTop() });

  const partyMember = params.source === "party" ? party.find((m) => m.uid === params.uid) : undefined;
  // A party member's page carries its species' Codex entry too — description, era, line.
  const dexEntry = getDexEntry(params.source === "species" ? params.speciesId : partyMember?.speciesId ?? "");

  if (params.source === "party" && !partyMember) {
    return (
      <ScreenBackground style={styles.container}>
        <Text style={styles.notFound}>{t("detail.notFound")}</Text>
        <PrimaryButton testID="back-button" label={t("common.back")} onPress={() => navigation.goBack()} />
      </ScreenBackground>
    );
  }
  if (params.source === "species" && !dexEntry) {
    return (
      <ScreenBackground style={styles.container}>
        <Text style={styles.notFound}>{t("detail.unknown")}</Text>
        <PrimaryButton testID="back-button" label={t("common.back")} onPress={() => navigation.goBack()} />
      </ScreenBackground>
    );
  }

  const name = partyMember?.displayName ?? dexEntry!.name;
  const speciesId = partyMember?.speciesId ?? dexEntry!.speciesId;
  const types = partyMember?.types ?? dexEntry!.types;
  const level = partyMember?.level ?? null;
  const stats = partyMember ? partyMemberStats(partyMember) : dexEntry?.stats;
  const flavor = dexEntry ? c.flavor(dexEntry.speciesId) ?? dexEntry.flavor : undefined;
  const signatureMove = dexEntry?.signatureMove ? c.signature(dexEntry.signatureMove) : undefined;
  const isCaught = params.source === "species" ? caughtSpeciesIds.includes(params.speciesId) : true;


  function handleStartRename() {
    setNameDraft(partyMember?.displayName ?? "");
    setRenaming(true);
  }

  function handleSaveRename() {
    if (partyMember) renamePartyMember(partyMember.uid, nameDraft);
    setRenaming(false);
  }

  return (
    <ScreenBackground style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerTopRow}>
          <CreatureAvatar speciesId={speciesId} types={types} size={72} />
          <View style={styles.headerInfo}>
            {renaming ? (
              <View style={styles.renameRow}>
                <TextInput
                  testID="rename-input"
                  value={nameDraft}
                  onChangeText={setNameDraft}
                  maxLength={16}
                  autoFocus
                  placeholder={name}
                  placeholderTextColor={colors.textMuted}
                  style={styles.renameInput}
                  returnKeyType="done"
                  onSubmitEditing={handleSaveRename}
                />
                <Pressable testID="save-rename" onPress={handleSaveRename} style={styles.renameSaveBtn}>
                  <Text style={styles.renameSaveBtnText}>{t("common.save")}</Text>
                </Pressable>
                <Pressable testID="cancel-rename" onPress={() => setRenaming(false)} style={styles.renameCancelBtn}>
                  <Text style={styles.renameCancelBtnText}>{t("common.cancel")}</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.headerRow}>
                <Text style={styles.name}>{name}</Text>
                {level !== null && <Text style={styles.level}>{t("common.level", { level })}</Text>}
                {partyMember && (
                  <Pressable testID="rename-button" onPress={handleStartRename} style={styles.renameButton}>
                    <Text style={styles.renameButtonText}>{t("detail.rename")}</Text>
                  </Pressable>
                )}
              </View>
            )}
            <View style={styles.badgeRow}>
              {types.map((type) => (
                <TypeBadge key={type} type={type} />
              ))}
            </View>
          </View>
        </View>

        {partyMember && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("detail.condition")}</Text>
            <HpBar currentHp={partyMember.currentHp} maxHp={partyMemberStats(partyMember).hp} />
            <Text style={styles.xpText}>
              {t("detail.xp", { xp: partyMember.xp, next: xpToNextLevel(partyMember.level), level: partyMember.level + 1 })}
            </Text>
            <Pressable
              testID="open-detail-item-sheet"
              onPress={() => itemFlow.chooseItemFor(partyMember.uid)}
              disabled={!itemFlow.hasUsableItems}
              style={[styles.useItemButton, !itemFlow.hasUsableItems && styles.useItemButtonDisabled]}
            >
              <Text style={[styles.useItemButtonText, !itemFlow.hasUsableItems && styles.useItemButtonTextDisabled]}>
                {itemFlow.hasUsableItems ? t("detail.useItem") : t("detail.noItems")}
              </Text>
            </Pressable>
            {itemFlow.feedback && <Text style={styles.flavorText}>{itemFlow.feedback}</Text>}
          </View>
        )}

        {flavor && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{dexEntry?.category === "legendary" ? t("detail.aesthetic") : t("detail.flavor")}</Text>
            <Text style={styles.flavorText}>{flavor}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("detail.baseStats")}</Text>
          {stats ? (
            STAT_KEYS.map((key) => <StatBar key={key} label={c.stat(key)} value={stats[key]} />)
          ) : (
            <Text style={styles.unrecorded}>{t("detail.statsMissing")}</Text>
          )}
        </View>

        <EvolutionSection
          speciesId={speciesId}
          known={(id) => seenSpeciesIds.includes(id) || caughtSpeciesIds.includes(id) || party.some((m) => m.speciesId === id)}
          onOpen={(id) => navigation.push("CreatureDetail", { source: "species", speciesId: id })}
        />

        {dexEntry?.era && dexEntry.era !== "wild" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("detail.era")}</Text>
            <Text style={styles.flavorText}>{c.era(dexEntry.era)}</Text>
          </View>
        )}

        {signatureMove && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("detail.signature")}</Text>
            <Text style={styles.flavorText}>{signatureMove}</Text>
          </View>
        )}

        {partyMember && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("detail.moves")}</Text>
            <Text style={styles.xpText}>{t("detail.movesHint")}</Text>
            {partyMember.moveIds.map((moveId) => {
              const move = getMove(moveId);
              const open = openMoveId === moveId;
              return (
                <View key={moveId}>
                  <Pressable
                    testID={`detail-move-${moveId}`}
                    accessibilityRole="button"
                    accessibilityState={{ expanded: open }}
                    onPress={() => setOpenMoveId(open ? null : moveId)}
                    style={({ pressed }) => [styles.moveRow, pressed && styles.moveRowPressed]}
                  >
                    <Text style={styles.moveName}>{c.move(moveId)}</Text>
                    <TypeBadge type={move.type} />
                    <Text style={styles.movePower}>
                      {t("move.pp")} {t("move.ppLeft", { left: remainingPp(partyMember, moveId), max: move.pp })}
                    </Text>
                    <Text style={styles.moveChevron}>{open ? "▾" : "▸"}</Text>
                  </Pressable>
                  {open && <MoveDetailCard move={move} ppLeft={remainingPp(partyMember, moveId)} />}
                </View>
              );
            })}
          </View>
        )}

        {params.source === "species" && !isCaught && (
          <Text style={styles.unrecorded}>{t("detail.uncaught")}</Text>
        )}

        {partyMember && party.length > 1 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("detail.release")}</Text>
            {confirmingRelease ? (
              <View style={styles.releaseConfirmRow}>
                <Text style={styles.flavorText}>{t("detail.releaseConfirm", { name: partyMember.displayName })}</Text>
                <View style={styles.releaseConfirmButtons}>
                  <Pressable
                    testID="confirm-release"
                    onPress={() => {
                      releaseCreature(partyMember.uid);
                      navigation.goBack();
                    }}
                    style={styles.releaseConfirmBtn}
                  >
                    <Text style={styles.releaseConfirmBtnText}>{t("common.yesRelease")}</Text>
                  </Pressable>
                  <Pressable testID="cancel-release" onPress={() => setConfirmingRelease(false)} style={styles.releaseCancelBtn}>
                    <Text style={styles.releaseCancelBtnText}>{t("common.cancel")}</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <Pressable testID="release-button" onPress={() => setConfirmingRelease(true)} style={styles.releaseButton}>
                <Text style={styles.releaseButtonText}>{t("detail.releaseName", { name: partyMember.displayName })}</Text>
              </Pressable>
            )}
          </View>
        )}
      </ScrollView>

      {itemFlow.overlays}

      <PrimaryButton testID="back-button" label={t("common.back")} variant="secondary" onPress={() => navigation.goBack()} />
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 24,
    gap: 16,
  },
  scrollContent: {
    gap: 18,
    paddingBottom: 12,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  headerInfo: {
    flex: 1,
    gap: 6,
  },
  headerRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "baseline",
    gap: 8,
  },
  name: {
    color: colors.text,
    fontSize: 26,
    fontWeight: "700",
  },
  level: {
    color: colors.textMuted,
    fontSize: 16,
  },
  renameButton: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  renameButtonText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "700",
  },
  renameRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
  },
  renameInput: {
    flex: 1,
    minWidth: 120,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    color: colors.text,
    fontSize: 16,
  },
  renameSaveBtn: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  renameSaveBtnText: {
    color: "#0d1b2a",
    fontSize: 12,
    fontWeight: "700",
  },
  renameCancelBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  renameCancelBtnText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  badgeRow: {
    flexDirection: "row",
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 10,
  },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  flavorText: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  unrecorded: {
    color: colors.textMuted,
    fontSize: 12,
    fontStyle: "italic",
  },
  xpText: {
    color: colors.textMuted,
    fontSize: 11,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statLabel: {
    color: colors.text,
    fontSize: 12,
    width: 84,
  },
  statBarTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.background,
    overflow: "hidden",
  },
  statBarFill: {
    height: "100%",
    backgroundColor: colors.accent,
  },
  statValue: {
    color: colors.textMuted,
    fontSize: 12,
    width: 32,
    textAlign: "right",
  },
  moveRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: colors.surfaceAlt,
  },
  linkText: {
    color: colors.accentDeep,
    fontWeight: "700",
  },
  moveRowPressed: {
    opacity: 0.75,
  },
  moveChevron: {
    color: colors.textMuted,
    fontSize: 14,
    width: 14,
    textAlign: "center",
  },
  moveName: {
    color: colors.text,
    fontSize: 14,
    flex: 1,
  },
  movePower: {
    color: colors.textMuted,
    fontSize: 12,
  },
  notFound: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: "center",
    marginTop: 100,
  },
  releaseButton: {
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  releaseButtonText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: "700",
  },
  releaseConfirmRow: {
    gap: 10,
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
  useItemButton: {
    alignSelf: "flex-start",
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  useItemButtonDisabled: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.border,
  },
  useItemButtonText: {
    color: "#0d1b2a",
    fontSize: 13,
    fontWeight: "700",
  },
  useItemButtonTextDisabled: {
    color: colors.textMuted,
  },
});
