import { StyleSheet, Text, View } from "react-native";
import type { MoveData } from "../../data/schemas";
import { describeMove } from "../../game/moveInfo";
import { useI18n } from "../../i18n";
import { TypeBadge } from "./TypeBadge";
import { colors } from "../theme";

/**
 * Everything about one move: the numbers, what it does when used, and which types it is good
 * or bad against. Used on a creature's detail page and in battle, so a player can check a move
 * before committing a turn to it.
 */
export function MoveDetailCard({ move, ppLeft }: { move: MoveData; ppLeft?: number }) {
  const i18n = useI18n();
  const { t } = i18n;
  const info = describeMove(move, i18n);

  return (
    <View testID={`move-detail-${move.id}`} style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.name}>{info.name}</Text>
        <TypeBadge type={move.type} />
      </View>

      <View style={styles.stats}>
        <Stat label={t("move.power")} value={info.power} />
        <Stat label={t("move.accuracy")} value={info.accuracy} />
        <Stat
          label={t("move.pp")}
          value={ppLeft !== undefined ? t("move.ppLeft", { left: ppLeft, max: move.pp }) : String(move.pp)}
        />
        <Stat label="" value={info.category} muted />
      </View>

      <Text style={styles.heading}>{t("move.whatItDoes")}</Text>
      {info.effects.map((line) => (
        <Text key={line} style={styles.line}>
          • {line}
        </Text>
      ))}

      {info.matchups.length > 0 && (
        <>
          <Text style={styles.heading}>{t("move.matchups")}</Text>
          {info.matchups.map((line) => (
            <Text key={line} style={styles.line}>
              • {line}
            </Text>
          ))}
        </>
      )}
    </View>
  );
}

function Stat({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, muted && styles.statMuted]}>{value}</Text>
      {label ? <Text style={styles.statLabel}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 6,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  name: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "800",
    flexShrink: 1,
  },
  stats: {
    flexDirection: "row",
    gap: 8,
    marginVertical: 4,
  },
  stat: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 10,
    paddingVertical: 7,
    alignItems: "center",
  },
  statValue: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
  },
  statMuted: {
    fontSize: 12,
    color: colors.textMuted,
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: "700",
    marginTop: 1,
  },
  heading: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginTop: 6,
  },
  line: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 19,
  },
});
