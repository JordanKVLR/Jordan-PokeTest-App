import { StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { useGameStore } from "../state/gameStore";
import { ALL_MEDALS } from "../game/zoneProgression";
import { partyMemberStats } from "../game/party";
import { HpBar } from "./components/HpBar";
import { PrimaryButton } from "./components/PrimaryButton";
import { TypeBadge } from "./components/TypeBadge";
import { ScreenBackground } from "./components/ScreenBackground";
import { HoverTip } from "./components/HoverTip";
import { useKeyboardShortcuts } from "./components/useKeyboardShortcuts";
import { colors } from "./theme";
import { completionProgress } from "../game/trainers";
import { useI18n } from "../i18n";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export function HomeScreen({ navigation }: Props) {
  const currentZoneId = useGameStore((s) => s.currentZoneId);
  const party = useGameStore((s) => s.party);
  const battlesWon = useGameStore((s) => s.battlesWon);
  const medals = useGameStore((s) => s.medals);
  const defeatedTrainerIds = useGameStore((s) => s.defeatedTrainerIds);
  // Beating every trainer and every gym leader is the win condition, so the count belongs
  // where the player checks their progress rather than only appearing once it is finished.
  const progress = completionProgress(defeatedTrainerIds);
  const currency = useGameStore((s) => s.currency);

  const leadMember = party[0];
  const { t, c } = useI18n();
  const zoneName = c.stage(currentZoneId);

  useKeyboardShortcuts({
    b: () => navigation.navigate("Bag"),
    p: () => navigation.navigate("Party"),
    m: () => navigation.popToTop(),
  });

  return (
    <ScreenBackground style={styles.container}>
      <View style={styles.hud}>
        <View style={styles.hudTopRow}>
          <Text style={styles.zoneLabel}>{zoneName}</Text>
          <Text style={styles.currency}>{t("common.gold", { amount: currency })}</Text>
        </View>
        {leadMember && (
          <View style={styles.partyCard}>
            <Text style={styles.partyName}>
              {leadMember.displayName} <Text style={styles.partyLevel}>{t("common.level", { level: leadMember.level })}</Text>
            </Text>
            <View style={styles.badgeRow}>
              {leadMember.types.map((type) => (
                <TypeBadge key={type} type={type} />
              ))}
            </View>
            <HpBar currentHp={leadMember.currentHp} maxHp={partyMemberStats(leadMember).hp} />
          </View>
        )}
        <Text style={styles.stat}>{t("home.battlesWon", { count: battlesWon })}</Text>
        <Text style={styles.stat} testID="completion-progress">
          {progress.complete
            ? t("home.complete")
            : t("home.trainersBeaten", { done: progress.trainersDefeated, total: progress.trainersTotal })}
        </Text>

        {/* Medal track: four gyms across the run, shown filled as they are won. */}
        <View style={styles.medalRow}>
          {ALL_MEDALS.map((medal) => {
            const earned = medals.includes(medal.medalId);
            return (
              <View
                key={medal.medalId}
                testID={`medal-${medal.medalId}${earned ? "-earned" : ""}`}
                style={[styles.medal, earned && styles.medalEarned]}
              >
                <Text style={[styles.medalGlyph, earned && styles.medalGlyphEarned]}>{earned ? "★" : "☆"}</Text>
                <Text style={[styles.medalLabel, earned && styles.medalLabelEarned]} numberOfLines={1}>
                  {c.medal(medal.medalId).replace(" Medal", "").replace("Midalja ", "")}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.actions}>
        <HoverTip text={t("home.tip.explore")}>
          <PrimaryButton testID="nav-explore" label={t("home.explore", { zone: zoneName })} onPress={() => navigation.popToTop()} />
        </HoverTip>
        <HoverTip text={t("home.tip.party")}>
          <PrimaryButton
            testID="nav-party"
            label={t("home.party")}
            variant="secondary"
            onPress={() => navigation.navigate("Party")}
          />
        </HoverTip>
        <HoverTip text={t("home.tip.codex")}>
          <PrimaryButton
            testID="nav-codex"
            label={t("home.codex")}
            variant="secondary"
            onPress={() => navigation.navigate("Codex")}
          />
        </HoverTip>
        <HoverTip text={t("home.tip.bag")}>
          <PrimaryButton
            testID="nav-bag"
            label={t("home.bag")}
            variant="secondary"
            onPress={() => navigation.navigate("Bag")}
          />
        </HoverTip>
        <HoverTip text={t("home.tip.shop")}>
          <PrimaryButton
            testID="nav-shop"
            label={t("home.shop")}
            variant="secondary"
            onPress={() => navigation.navigate("Shop")}
          />
        </HoverTip>
        <HoverTip text={t("home.tip.help")}>
          <PrimaryButton
            testID="nav-help"
            label={t("home.help")}
            variant="secondary"
            onPress={() => navigation.navigate("Help")}
          />
        </HoverTip>
        <HoverTip text={t("home.tip.settings")}>
          <PrimaryButton
            testID="nav-settings"
            label={t("home.settings")}
            variant="secondary"
            onPress={() => navigation.navigate("Settings")}
          />
        </HoverTip>
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 64,
    paddingBottom: 32,
  },
  hud: {
    gap: 16,
  },
  hudTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  zoneLabel: {
    color: colors.textMuted,
    fontSize: 13,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  currency: {
    color: colors.accent,
    fontSize: 15,
    fontWeight: "700",
  },
  partyCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 8,
  },
  partyName: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "700",
  },
  partyLevel: {
    color: colors.textMuted,
    fontWeight: "400",
    fontSize: 14,
  },
  badgeRow: {
    flexDirection: "row",
  },
  medalRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 8,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  medal: {
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    minWidth: 68,
  },
  medalEarned: {
    borderColor: colors.accent,
    backgroundColor: "#fff6e2",
  },
  medalGlyph: {
    fontSize: 16,
    color: colors.textMuted,
  },
  medalGlyphEarned: {
    color: colors.accent,
  },
  medalLabel: {
    fontSize: 9,
    color: colors.textMuted,
    fontWeight: "700",
  },
  medalLabelEarned: {
    color: colors.accentDeep,
  },
  stat: {
    color: colors.textMuted,
    fontSize: 14,
  },
  actions: {
    gap: 12,
  },
});
