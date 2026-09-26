import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { useI18n, type StringKey } from "../i18n";
import { useSettings } from "../state/settingsStore";
import { nowPlaying, playJingle, requestMusic } from "../audio/engine";
import { TRACKS, type TrackId } from "../audio/tracks";
import { PrimaryButton } from "./components/PrimaryButton";
import { ScreenBackground } from "./components/ScreenBackground";
import { useKeyboardShortcuts } from "./components/useKeyboardShortcuts";
import { colors } from "./theme";

type Props = NativeStackScreenProps<RootStackParamList, "MusicRoom">;

/** The soundtrack in the order you meet it: the pieces that loop, then the short ones. */
const PIECES: TrackId[] = [
  "title",
  "overworld",
  "harbour",
  "bastions",
  "battleWild",
  "battleTrainer",
  "battleGym",
  "evolution",
  "finale",
  "victory",
  "caught",
  "levelUp",
  "medal",
  "heal",
  "blackout",
];

/**
 * Every piece of music in the game, to listen to on its own. Leaving puts back whatever the
 * screen underneath wants.
 */
export function MusicRoomScreen({ navigation }: Props) {
  const { t } = useI18n();
  const musicVolume = useSettings((s) => s.musicVolume);
  const [playing, setPlaying] = useState<TrackId | null>(nowPlaying().music);

  useKeyboardShortcuts({ m: () => navigation.popToTop() });

  // Keep the highlight honest if a jingle finishes or something else takes over.
  useEffect(() => {
    const timer = setInterval(() => setPlaying((prev) => (TRACKS[prev ?? "title"]?.loop ? nowPlaying().music : prev)), 800);
    return () => clearInterval(timer);
  }, []);

  function play(id: TrackId) {
    if (TRACKS[id].loop) requestMusic(id, 0.4);
    else playJingle(id, { then: "resume" });
    setPlaying(id);
  }

  return (
    <ScreenBackground style={styles.container}>
      <Text style={styles.title}>{t("musicRoom.title")}</Text>
      <Text style={styles.subtitle}>{t("musicRoom.subtitle")}</Text>
      {musicVolume === "off" && <Text style={styles.warning}>{t("musicRoom.musicOff")}</Text>}

      <ScrollView contentContainerStyle={styles.list}>
        {PIECES.map((id) => {
          const active = playing === id;
          return (
            <Pressable
              key={id}
              testID={`music-${id}`}
              onPress={() => play(id)}
              style={({ pressed }) => [styles.row, active && styles.rowActive, pressed && styles.rowPressed]}
            >
              <Text style={[styles.icon, active && styles.iconActive]}>{active ? "♪" : "▶"}</Text>
              <View style={styles.rowText}>
                <Text style={[styles.name, active && styles.nameActive]}>{t(`musicRoom.track.${id}` as StringKey)}</Text>
                <Text style={[styles.meta, active && styles.metaActive]}>
                  {t(`musicRoom.where.${id}` as StringKey)} · {TRACKS[id].loop ? t("musicRoom.loop") : t("musicRoom.jingle")}
                </Text>
              </View>
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
    lineHeight: 18,
  },
  warning: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: "700",
  },
  list: {
    gap: 8,
    paddingVertical: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  rowActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accentDeep,
  },
  rowPressed: {
    opacity: 0.8,
  },
  icon: {
    width: 22,
    textAlign: "center",
    color: colors.accentDeep,
    fontSize: 16,
    fontWeight: "800",
  },
  iconActive: {
    color: "#ffffff",
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  name: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
  },
  nameActive: {
    color: "#ffffff",
  },
  meta: {
    color: colors.textMuted,
    fontSize: 12,
  },
  metaActive: {
    color: "rgba(255,255,255,0.85)",
  },
});
