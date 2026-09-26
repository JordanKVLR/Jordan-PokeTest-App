import { Component, type ErrorInfo, type ReactNode } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

/**
 * If anything in the game throws while drawing, React unmounts the whole tree and the page goes
 * blank. This catches it and says what happened instead, with a way to try again — and the
 * error itself on screen, so a player can pass it on. Deliberately plain: no translations, no
 * theme, nothing that could itself be what broke.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("A Maltese Tale crashed:", error, info.componentStack);
  }

  private reload = () => {
    if (Platform.OS === "web" && typeof location !== "undefined") {
      location.replace(`${location.pathname}?v=${Date.now()}`);
    } else {
      this.setState({ error: null });
    }
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <View style={styles.page}>
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.body}>Xi ħaġa marret ħażin. Your save is safe — try again.</Text>
        <Pressable testID="crash-reload" onPress={this.reload} style={styles.button}>
          <Text style={styles.buttonText}>Reload / Erġa' ipprova</Text>
        </Pressable>
        <ScrollView style={styles.detailBox}>
          <Text selectable style={styles.detail}>
            {String(error.stack || error.message || error)}
          </Text>
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
    backgroundColor: "#eaf4f8",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1d2b36",
  },
  body: {
    fontSize: 14,
    color: "#1d2b36",
    textAlign: "center",
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 999,
    backgroundColor: "#f0a030",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  detailBox: {
    maxHeight: 200,
    alignSelf: "stretch",
  },
  detail: {
    fontSize: 11,
    color: "#7a8a96",
  },
});
