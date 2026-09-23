import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { useGameStore } from "../state/gameStore";
import { ITEM_CATEGORIES, itemsByCategory } from "../game/itemsRepo";
import type { ItemCategory } from "../data/schemas";
import { PrimaryButton } from "./components/PrimaryButton";
import { ScreenBackground } from "./components/ScreenBackground";
import { useKeyboardShortcuts } from "./components/useKeyboardShortcuts";
import { colors } from "./theme";
import { useI18n } from "../i18n";

type Props = NativeStackScreenProps<RootStackParamList, "Bag">;

export function BagScreen({ navigation }: Props) {
  const inventory = useGameStore((s) => s.inventory);
  const [category, setCategory] = useState<ItemCategory>("balls");
  const { t, c } = useI18n();
  const TAB_LABEL: Record<ItemCategory, string> = {
    balls: t("bag.balls"),
    medicine: t("bag.medicine"),
    key_items: t("bag.keyItems"),
    battle_items: t("bag.battleItems"),
  };

  useKeyboardShortcuts({ m: () => navigation.popToTop() });

  const items = itemsByCategory(category).filter((item) => (inventory[item.id] ?? 0) > 0);

  return (
    <ScreenBackground style={styles.container}>
      <Text style={styles.title}>{t("bag.title")}</Text>

      <View style={styles.tabRow}>
        {ITEM_CATEGORIES.map((cat) => (
          <Pressable
            key={cat.key}
            testID={`bag-tab-${cat.key}`}
            onPress={() => setCategory(cat.key)}
            style={[styles.tab, category === cat.key && styles.tabActive]}
          >
            <Text style={[styles.tabText, category === cat.key && styles.tabTextActive]}>{TAB_LABEL[cat.key]}</Text>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {items.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.itemName}>{c.item(item.id)}</Text>
              <Text style={styles.itemQty}>x{inventory[item.id] ?? 0}</Text>
            </View>
            <Text style={styles.itemDescription}>{c.itemDescription(item.id)}</Text>
            {item.catchMultiplier && (
              <Text style={styles.itemMeta}>{t("bag.catchMultiplier", { value: item.catchMultiplier.toFixed(1) })}</Text>
            )}
            {item.effect === "heal" && item.healAmount && (
              <Text style={styles.itemMeta}>{t("bag.restores", { amount: item.healAmount })}</Text>
            )}
            {item.effect === "level_up" && <Text style={styles.itemMeta}>{t("bag.levelUp")}</Text>}
          </View>
        ))}
        {items.length === 0 && <Text style={styles.empty}>{t("bag.empty")}</Text>}
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
    gap: 12,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "700",
  },
  tabRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tab: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  tabActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  tabText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "600",
  },
  tabTextActive: {
    color: "#0d1b2a",
  },
  list: {
    gap: 12,
    paddingVertical: 4,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 6,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  itemName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
  },
  itemQty: {
    color: colors.textMuted,
    fontSize: 14,
  },
  itemDescription: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
  },
  itemMeta: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: "600",
  },
  empty: {
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 40,
  },
});
