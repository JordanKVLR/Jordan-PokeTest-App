import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { useGameStore } from "../state/gameStore";
import { DEX_ENTRIES, ERA_ORDER } from "../game/speciesCatalog";
import type { Era, TypeName } from "../data/schemas";
import { TypeBadge } from "./components/TypeBadge";
import { CreatureAvatar } from "./components/CreatureAvatar";
import { PrimaryButton } from "./components/PrimaryButton";
import { ScreenBackground } from "./components/ScreenBackground";
import { useKeyboardShortcuts } from "./components/useKeyboardShortcuts";
import { colors, typeColor } from "./theme";
import { useI18n } from "../i18n";

type Props = NativeStackScreenProps<RootStackParamList, "Codex">;

const ALL_TYPES: TypeName[] = Array.from(new Set(DEX_ENTRIES.flatMap((e) => e.types))).sort();

export function CodexScreen({ navigation }: Props) {
  const seenSpeciesIds = useGameStore((s) => s.seenSpeciesIds);
  const caughtSpeciesIds = useGameStore((s) => s.caughtSpeciesIds);
  const [typeFilter, setTypeFilter] = useState<TypeName | null>(null);
  const [eraFilter, setEraFilter] = useState<Era | null>(null);
  const { t, c } = useI18n();

  useKeyboardShortcuts({ m: () => navigation.popToTop() });

  const entries = useMemo(
    () =>
      DEX_ENTRIES.filter(
        (e) => (!typeFilter || e.types.includes(typeFilter)) && (!eraFilter || e.era === eraFilter)
      ),
    [typeFilter, eraFilter]
  );

  /** Only offer era chips for eras that actually have creatures in them. */
  const eras = useMemo(() => ERA_ORDER.filter((era) => DEX_ENTRIES.some((e) => e.era === era)), []);

  const seenCount = DEX_ENTRIES.filter((e) => seenSpeciesIds.includes(e.speciesId)).length;

  return (
    <ScreenBackground style={styles.container}>
      <Text style={styles.title}>{t("codex.title")}</Text>
      <Text style={styles.subtitle}>
        {t("codex.progress", { seen: seenCount, caught: caughtSpeciesIds.length, total: DEX_ENTRIES.length })}
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterRow}>
        <Pressable
          testID="era-filter-all"
          onPress={() => setEraFilter(null)}
          style={[styles.filterChip, eraFilter === null && styles.filterChipActive]}
        >
          <Text style={styles.filterChipText}>{t("codex.allEras")}</Text>
        </Pressable>
        {eras.map((era) => (
          <Pressable
            key={era}
            testID={`era-filter-${era}`}
            onPress={() => setEraFilter(era)}
            style={[styles.filterChip, eraFilter === era && styles.filterChipActive]}
          >
            <Text style={styles.filterChipText}>{c.era(era).split(" · ")[0]}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterRow}>
        <Pressable
          onPress={() => setTypeFilter(null)}
          style={[styles.filterChip, typeFilter === null && styles.filterChipActive]}
        >
          <Text style={styles.filterChipText}>{t("codex.allTypes")}</Text>
        </Pressable>
        {ALL_TYPES.map((type) => (
          <Pressable
            key={type}
            onPress={() => setTypeFilter(type)}
            style={[
              styles.filterChip,
              { borderColor: typeColor(type) },
              typeFilter === type && { backgroundColor: typeColor(type) },
            ]}
          >
            <Text style={styles.filterChipText}>{c.type(type)}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.grid}>
        {entries.map((entry) => {
          const seen = seenSpeciesIds.includes(entry.speciesId);
          const caught = caughtSpeciesIds.includes(entry.speciesId);
          const revealed = seen || caught;

          return (
            <Pressable
              key={entry.speciesId}
              testID={`dex-entry-${entry.speciesId}`}
              disabled={!revealed}
              onPress={() =>
                navigation.navigate("CreatureDetail", { source: "species", speciesId: entry.speciesId })
              }
              style={({ pressed }) => [styles.cell, pressed && revealed && styles.cellPressed]}
            >
              {revealed && (
                <View style={styles.avatarRow}>
                  <CreatureAvatar speciesId={entry.speciesId} types={entry.types} size={40} />
                </View>
              )}
              <Text style={styles.cellName}>{revealed ? entry.name : "???"}</Text>
              {revealed ? (
                <View style={styles.badgeRow}>
                  {entry.types.map((type) => (
                    <TypeBadge key={type} type={type} />
                  ))}
                </View>
              ) : (
                <Text style={styles.unseen}>{t("codex.unseen")}</Text>
              )}
              {revealed && entry.era && entry.era !== "wild" && (
                <Text style={styles.eraLabel}>{c.era(entry.era)}</Text>
              )}
              {caught && <Text style={styles.caughtLabel}>{t("codex.caught")}</Text>}
              {seen && !caught && <Text style={styles.seenLabel}>{t("codex.seen")}</Text>}
            </Pressable>
          );
        })}
      </ScrollView>

      <PrimaryButton testID="back-button" label={t("common.back")} variant="secondary" onPress={() => navigation.goBack()} />
    </ScreenBackground>
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
    marginBottom: 10,
  },
  eraLabel: {
    color: colors.accentDeep,
    fontSize: 10,
    fontWeight: "700",
    marginTop: 4,
  },
  // A horizontal ScrollView stretches to fill the cross axis by default, which on web left a
  // tall empty band under each chip row. Pin it to its content height instead.
  filterScroll: {
    flexGrow: 0,
    flexShrink: 0,
    alignSelf: "stretch",
  },
  filterRow: {
    gap: 8,
    paddingBottom: 12,
    // Without this the chips stretch to the scroll view's cross-axis height and the border
    // ends up drawn straight through the label.
    alignItems: "center",
  },
  filterChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  filterChipActive: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.accent,
  },
  filterChipText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "600",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    paddingBottom: 8,
  },
  cell: {
    flexBasis: "47%",
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    gap: 6,
    minHeight: 92,
  },
  cellPressed: {
    opacity: 0.8,
  },
  cellName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
  },
  avatarRow: {
    alignItems: "flex-start",
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  unseen: {
    color: colors.textMuted,
    fontSize: 11,
    fontStyle: "italic",
  },
  caughtLabel: {
    color: colors.success,
    fontSize: 11,
    fontWeight: "700",
  },
  seenLabel: {
    color: colors.textMuted,
    fontSize: 11,
  },
});
