import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { useSettings } from "../state/settingsStore";
import { SETTINGS_SECTIONS as SECTIONS } from "../game/settingsLayout";
import { useI18n, type StringKey } from "../i18n";
import { PrimaryButton } from "./components/PrimaryButton";
import { ScreenBackground } from "./components/ScreenBackground";
import { useKeyboardShortcuts } from "./components/useKeyboardShortcuts";
import { colors } from "./theme";

type Props = NativeStackScreenProps<RootStackParamList, "Settings">;

export function SettingsScreen({ navigation }: Props) {
  const { t } = useI18n();
  const settings = useSettings();
  const [resetNote, setResetNote] = useState(false);

  useKeyboardShortcuts({ m: () => navigation.popToTop() });

  const k = (key: string) => key as StringKey;

  return (
    <ScreenBackground style={styles.container}>
      <Text style={styles.title}>{t("settings.title")}</Text>
      <Text style={styles.subtitle}>{t("settings.subtitle")}</Text>

      <ScrollView contentContainerStyle={styles.list}>
        {SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{t(section.title)}</Text>
            {section.rows.map((row) => (
              <View key={row.key} style={styles.row} testID={`setting-${row.key}`}>
                <View style={styles.rowText}>
                  <Text style={styles.label}>{t(k(`settings.${row.key}`))}</Text>
                  <Text style={styles.help}>{t(k(`settings.${row.key}.help`))}</Text>
                </View>

                {row.kind === "choice" ? (
                  <>
                    <View style={styles.segment}>
                      {row.options.map((option) => {
                        const selected = settings[row.key] === option;
                        return (
                          <Pressable
                            key={option}
                            testID={`setting-${row.key}-${option}`}
                            accessibilityRole="radio"
                            accessibilityState={{ selected }}
                            onPress={() => settings.set(row.key, option as never)}
                            style={({ pressed }) => [
                              styles.segmentOption,
                              selected && styles.segmentSelected,
                              pressed && !selected && styles.segmentPressed,
                            ]}
                          >
                            <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>
                              {t(k(`settings.${row.key}.${option}`))}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                    {row.describeOptions && (
                      <Text testID={`setting-${row.key}-explained`} style={styles.optionHelp}>
                        {t(k(`settings.${row.key}.${settings[row.key]}.help`))}
                      </Text>
                    )}
                  </>
                ) : (
                  <Pressable
                    testID={`setting-${row.key}-toggle`}
                    accessibilityRole="switch"
                    accessibilityState={{ checked: settings[row.key] }}
                    onPress={() => settings.set(row.key, !settings[row.key])}
                    style={[styles.toggle, settings[row.key] && styles.toggleOn]}
                  >
                    <View style={[styles.knob, settings[row.key] && styles.knobOn]} />
                    <Text style={[styles.toggleText, settings[row.key] && styles.toggleTextOn]}>
                      {settings[row.key] ? t("common.on") : t("common.off")}
                    </Text>
                  </Pressable>
                )}
              </View>
            ))}
          </View>
        ))}

        <Pressable
          testID="settings-reset"
          onPress={() => {
            settings.resetSettings();
            setResetNote(true);
          }}
          style={({ pressed }) => [styles.reset, pressed && styles.segmentPressed]}
        >
          <Text style={styles.resetText}>{t("settings.reset")}</Text>
        </Pressable>
        {resetNote && <Text style={styles.resetNote}>{t("settings.resetDone")}</Text>}
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
    maxWidth: 640,
    width: "100%",
    alignSelf: "center",
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: "800",
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 13,
  },
  list: {
    gap: 18,
    paddingVertical: 8,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    color: colors.accentDeep,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  row: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 10,
  },
  rowText: {
    gap: 3,
  },
  label: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
  },
  help: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
  },
  segment: {
    flexDirection: "row",
    backgroundColor: colors.surfaceAlt,
    borderRadius: 10,
    padding: 3,
    gap: 3,
  },
  segmentOption: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 6,
    borderRadius: 8,
    alignItems: "center",
  },
  segmentSelected: {
    backgroundColor: colors.accent,
  },
  segmentPressed: {
    backgroundColor: colors.border,
  },
  segmentText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
  segmentTextSelected: {
    color: "#ffffff",
  },
  optionHelp: {
    color: colors.text,
    fontSize: 12,
    lineHeight: 17,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 8,
    padding: 9,
  },
  toggle: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 8,
    paddingVertical: 6,
    paddingLeft: 6,
    paddingRight: 14,
    borderRadius: 999,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleOn: {
    backgroundColor: colors.accent,
    borderColor: colors.accentDeep,
  },
  knob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: colors.border,
  },
  knobOn: {
    borderColor: colors.accentDeep,
  },
  toggleText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "800",
  },
  toggleTextOn: {
    color: "#ffffff",
  },
  reset: {
    alignSelf: "center",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resetText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "700",
  },
  resetNote: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: "center",
  },
});
