import { StatusBar } from "expo-status-bar";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { AudioBridge } from "./src/audio/AudioBridge";
import { ErrorBoundary } from "./src/screens/components/ErrorBoundary";

export default function App() {
  return (
    <ErrorBoundary>
      <AudioBridge />
      <RootNavigator />
      <StatusBar style="light" />
    </ErrorBoundary>
  );
}
