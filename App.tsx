import { StatusBar } from "expo-status-bar";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { AudioBridge } from "./src/audio/AudioBridge";

export default function App() {
  return (
    <>
      <AudioBridge />
      <RootNavigator />
      <StatusBar style="light" />
    </>
  );
}
