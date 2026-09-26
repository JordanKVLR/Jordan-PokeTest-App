import { View, StyleSheet } from "react-native";
import type { TypeName } from "../../data/schemas";
import { designFor } from "../../art/creatureDesigns";
import { ThreeView } from "../../three/ThreeView";
import { createTurntableScene } from "../../three/turntableScene";
import { useSettings } from "../../state/settingsStore";
import { typeColor } from "../theme";

/** The creature in 3D, turning slowly on a plinth. Keyed by species so a new one rebuilds. */
export function Creature3D({ speciesId, types, height = 220 }: { speciesId: string; types: TypeName[]; height?: number }) {
  const reducedMotion = useSettings((s) => s.reducedMotion);
  return (
    <View style={[styles.frame, { height }]}>
      <ThreeView
        key={speciesId}
        testID="creature-3d"
        create={() => createTurntableScene(designFor(speciesId, types, typeColor), { reducedMotion })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    alignSelf: "stretch",
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#dfeef6",
  },
});
