import { ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { PrimaryButton } from "./components/PrimaryButton";
import { ScreenBackground } from "./components/ScreenBackground";
import { useKeyboardShortcuts } from "./components/useKeyboardShortcuts";
import { colors } from "./theme";
import { TypeChartTable } from "./components/TypeChartTable";
import { useI18n } from "../i18n";

type Props = NativeStackScreenProps<RootStackParamList, "Help">;

const SECTIONS = ["goal", "battle", "crux", "catch", "chapel", "party", "items", "controls", "settings"] as const;

export function HelpScreen({ navigation }: Props) {
  useKeyboardShortcuts({ m: () => navigation.popToTop() });
  const { t } = useI18n();

  return (
    <ScreenBackground style={styles.container}>
      <Text style={styles.title}>{t("help.title")}</Text>
      <Text style={styles.subtitle}>{t("help.subtitle")}</Text>

      <ScrollView contentContainerStyle={styles.list}>
        {SECTIONS.map((section) => (
          <View key={section} style={styles.card}>
            <Text style={styles.sectionTitle}>{t(`help.${section}.title`)}</Text>
            <Text style={styles.sectionBody}>{t(`help.${section}.body`)}</Text>
          </View>
        ))}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t("help.typeChart.title")}</Text>
          <Text style={styles.sectionBody}>{t("help.typeChart.body")}</Text>
        </View>
        <TypeChartTable />
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
    gap: 8,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "700",
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: 4,
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
  sectionTitle: {
    color: colors.accent,
    fontSize: 15,
    fontWeight: "700",
  },
  sectionBody: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
});
