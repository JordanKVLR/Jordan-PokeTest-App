import { StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import startersData from "../data/starters.json";
import { StartersFileSchema } from "../data/schemas";
import type { RootStackParamList } from "../navigation/types";
import { useGameStore } from "../state/gameStore";
import { PrimaryButton } from "./components/PrimaryButton";
import { TypeBadge } from "./components/TypeBadge";
import { ScreenBackground } from "./components/ScreenBackground";
import { colors } from "./theme";
import { useI18n } from "../i18n";
import { useMusic } from "../audio/useMusic";

type Props = NativeStackScreenProps<RootStackParamList, "StarterSelect">;

const starters = StartersFileSchema.parse(startersData).starters;

/** Reveal screen: the quiz already picked selectedLine, this just confirms it. */
export function StarterSelectScreen({ navigation }: Props) {
  useMusic("title");
  const playerName = useGameStore((s) => s.playerName);
  const selectedLine = useGameStore((s) => s.selectedLine);
  const party = useGameStore((s) => s.party);
  const currentZoneId = useGameStore((s) => s.currentZoneId);

  const starterLine = starters.find((s) => s.line === selectedLine);
  const stageOne = starterLine?.stages[0];
  const partner = party[0];
  const { t, c } = useI18n();

  const handleConfirm = () => {
    // Exploring (the Map) is the default screen — reset straight into it
    // rather than the Home menu.
    navigation.reset({ index: 0, routes: [{ name: "Map", params: { zoneId: currentZoneId } }] });
  };

  if (!starterLine || !stageOne) {
    return (
      <ScreenBackground style={styles.container}>
        <Text style={styles.title}>{t("starter.none")}</Text>
        <PrimaryButton label={t("starter.takeQuiz")} onPress={() => navigation.navigate("StarterQuiz")} />
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground style={styles.container}>
      <Text style={styles.eyebrow}>{t("starter.eyebrow")}</Text>
      <Text style={styles.title}>{t("starter.partner", { player: playerName, creature: stageOne.name })}</Text>

      <View style={styles.card}>
        <Text style={styles.name}>{stageOne.name}</Text>
        <View style={styles.badgeRow}>
          {stageOne.types.map((type) => (
            <TypeBadge key={type} type={type} />
          ))}
        </View>
        <Text style={styles.signature}>{t("starter.signature", { move: c.signature(starterLine.signatureMove) })}</Text>
        {partner && <Text style={styles.level}>{t("starter.startingLevel", { level: partner.level })}</Text>}
      </View>

      <PrimaryButton testID="confirm-starter" label={t("starter.confirm")} onPress={handleConfirm} />
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    gap: 20,
  },
  eyebrow: {
    color: colors.textMuted,
    fontSize: 13,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.accent,
    padding: 20,
    maxWidth: 340,
    width: "100%",
  },
  name: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  signature: {
    color: colors.textMuted,
    fontSize: 13,
  },
  level: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
});
