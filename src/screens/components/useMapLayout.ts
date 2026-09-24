import { useWindowDimensions } from "react-native";
import { computeMapLayout, type MapLayout } from "./mapLayout";

/** The live map layout, recomputed when the window resizes or the phone rotates. Kept apart
 * from computeMapLayout so the sizing rules can be tested without React Native loaded. */
export function useMapLayout(mapCols: number, mapRows: number): MapLayout {
  const { width, height } = useWindowDimensions();
  return computeMapLayout({ width, height }, mapCols, mapRows);
}
