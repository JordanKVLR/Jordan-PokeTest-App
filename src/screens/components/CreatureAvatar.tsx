import { StyleSheet, View } from "react-native";
import { typeColor } from "../theme";
import type { TypeName } from "../../data/schemas";
import { CreatureArt } from "../../art/creatureArt";
import { designFor } from "../../art/creatureDesigns";

interface Props {
  speciesId: string;
  types: TypeName[];
  size?: number;
  faded?: boolean;
}

/**
 * A creature's sprite. Drawn as vector art from a per-species design spec
 * (src/art/creatureDesigns.ts) rather than an image asset, so every creature has its own
 * silhouette at any size without shipping sprite sheets.
 *
 * `faded` is the Codex's "seen but not caught" state — the same sprite, dimmed.
 */
export function CreatureAvatar({ speciesId, types, size = 84, faded }: Props) {
  const design = designFor(speciesId, types, typeColor);
  return (
    <View style={[styles.wrap, { width: size, height: size }, faded ? styles.faded : null]}>
      <CreatureArt design={design} size={size} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  faded: {
    opacity: 0.35,
  },
});
