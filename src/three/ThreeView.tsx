import type { StyleProp, ViewStyle } from "react-native";

/** Native builds have no WebGL here; the 2D art stands in. See ThreeView.web.tsx. */
export interface ThreeController {
  scene: unknown;
  camera: unknown;
  frame?: (dt: number, time: number) => void;
  resize?: (width: number, height: number) => void;
  dispose?: () => void;
}

export function ThreeView(_props: { style?: StyleProp<ViewStyle>; create: () => ThreeController; testID?: string }) {
  return null;
}
