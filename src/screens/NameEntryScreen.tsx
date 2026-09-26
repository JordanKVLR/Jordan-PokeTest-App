import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { useGameStore } from "../state/gameStore";
import { PrimaryButton } from "./components/PrimaryButton";
import { ScreenBackground } from "./components/ScreenBackground";
import { colors } from "./theme";
import { useI18n } from "../i18n";
import { useMusic } from "../audio/useMusic";

type Props = NativeStackScreenProps<RootStackParamList, "NameEntry">;

export function NameEntryScreen({ navigation }: Props) {
  useMusic("title");
  const setPlayerName = useGameStore((s) => s.setPlayerName);
  const [name, setName] = useState("");
  const { t } = useI18n();

  function handleContinue() {
    setPlayerName(name);
    navigation.navigate("RegionSelect");
  }

  return (
    <ScreenBackground style={styles.container}>
      <View style={styles.body}>
        <Text style={styles.eyebrow}>{t("name.eyebrow")}</Text>
        <Text style={styles.title}>{t("name.prompt")}</Text>
        <TextInput
          testID="name-input"
          value={name}
          onChangeText={setName}
          placeholder={t("name.placeholder")}
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          maxLength={16}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={handleContinue}
        />
      </View>

      <PrimaryButton testID="name-continue" label={t("common.continue")} onPress={handleContinue} />
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 80,
  },
  body: {
    gap: 16,
    marginTop: 40,
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
    lineHeight: 30,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    color: colors.text,
  },
});
