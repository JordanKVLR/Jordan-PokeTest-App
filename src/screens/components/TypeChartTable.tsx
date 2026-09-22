import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ALL_TYPES, typeMatchups } from "../../engine/typeChart";
import type { TypeName } from "../../data/schemas";
import { colors, TYPE_COLORS } from "../theme";

/**
 * The full effectiveness chart, one type at a time.
 *
 * An 18x18 grid is the compact way to show this and the wrong one on a phone: the cells end up
 * smaller than a fingertip and nobody reads a matrix mid-battle anyway. What a player actually
 * wants is "I have a Fire creature — what should I avoid?", so each type gets a card answering
 * both directions in words, and tapping one opens it.
 */
export function TypeChartTable() {
  const [open, setOpen] = useState<TypeName | null>(null);

  return (
    <View style={styles.wrap}>
      {ALL_TYPES.map((type) => {
        const m = typeMatchups(type);
        const expanded = open === type;
        return (
          <View key={type} style={styles.card}>
            <Pressable
              testID={`type-row-${type}`}
              onPress={() => setOpen(expanded ? null : type)}
              style={styles.header}
            >
              <View style={[styles.chip, { backgroundColor: TYPE_COLORS[type] ?? colors.border }]}>
                <Text style={styles.chipText}>{type}</Text>
              </View>
              <Text style={styles.summary} numberOfLines={expanded ? undefined : 1}>
                {m.strongAgainst.length ? `Strong vs ${m.strongAgainst.join(", ")}` : "Never super effective"}
              </Text>
              <Text style={styles.caret}>{expanded ? "▾" : "▸"}</Text>
            </Pressable>

            {expanded && (
              <View testID={`type-detail-${type}`} style={styles.detail}>
                <Row label="Deals double to" value={m.strongAgainst} tone="good" />
                <Row label="Deals half to" value={m.weakAgainst} tone="bad" />
                <Row label="Does nothing to" value={m.noEffectAgainst} tone="bad" />
                <View style={styles.rule} />
                <Row label="Takes double from" value={m.weakTo} tone="bad" />
                <Row label="Takes half from" value={m.resists} tone="good" />
                <Row label="Untouchable by" value={m.immuneTo} tone="good" />
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

function Row({ label, value, tone }: { label: string; value: TypeName[]; tone: "good" | "bad" }) {
  if (!value.length) return null;
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, tone === "good" ? styles.good : styles.bad]}>{value.join(", ")}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  header: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 12, paddingVertical: 10 },
  chip: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, minWidth: 74, alignItems: "center" },
  chipText: { color: "#ffffff", fontSize: 12, fontWeight: "700" },
  summary: { flex: 1, color: colors.textMuted, fontSize: 12 },
  caret: { color: colors.textMuted, fontSize: 12 },
  detail: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 6,
  },
  row: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  rowLabel: { width: 122, color: colors.textMuted, fontSize: 12 },
  rowValue: { flex: 1, fontSize: 12, fontWeight: "600", lineHeight: 17 },
  good: { color: "#2f8f4e" },
  bad: { color: "#c04a3a" },
  rule: { height: 1, backgroundColor: colors.border, marginVertical: 4 },
});
