import { useRef } from "react";
import { Animated, Pressable, StyleSheet, Text } from "react-native";
import { colors } from "../theme";

interface Props {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary";
  testID?: string;
}

/**
 * Every button in the game presses in slightly and springs back. It is a small thing, but
 * without it taps feel like nothing happened until the next screen arrives.
 */
export function PrimaryButton({ label, onPress, disabled, variant = "primary", testID }: Props) {
  const scale = useRef(new Animated.Value(1)).current;

  const press = (toValue: number) =>
    Animated.spring(scale, { toValue, useNativeDriver: false, friction: 6, tension: 220 }).start();

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={() => !disabled && press(0.96)}
        onPressOut={() => press(1)}
        disabled={disabled}
        testID={testID}
        style={({ pressed }) => [
          styles.base,
          variant === "secondary" ? styles.secondary : styles.primary,
          disabled && styles.disabled,
          pressed && !disabled && styles.pressed,
        ]}
      >
        <Text style={[styles.text, variant === "secondary" && styles.secondaryText]}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  primary: {
    backgroundColor: colors.accent,
  },
  secondary: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.border,
  },
  disabled: {
    opacity: 0.4,
  },
  pressed: {
    opacity: 0.75,
  },
  text: {
    color: "#0d1b2a",
    fontWeight: "700",
    fontSize: 16,
  },
  secondaryText: {
    color: colors.text,
  },
});
