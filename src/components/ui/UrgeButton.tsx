import React from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter, useSegments } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

/**
 * The always-there urge button. Rendered once at the app root so it floats over
 * every screen — someone mid-craving should never have to navigate to reach
 * help. Hidden only where it makes no sense: before login, during onboarding,
 * on the urge flow itself, and on the SOS/crisis modal.
 */
export function UrgeButton() {
  const router = useRouter();
  const segments = useSegments();
  const insets = useSafeAreaInsets();

  const seg = segments as string[];
  const top = seg[0] ?? "";
  const sub = seg[1] ?? "";

  const hidden =
    top === "(auth)" ||
    top === "onboarding" ||
    top === "pro" ||
    // The hub (tabs index) has its own in-world "I NEED A DRINK" on the counter,
    // so the floating pill would be a duplicate there. It still shows on every
    // other screen, including the other tabs.
    (top === "(tabs)" && sub === "") ||
    (top === "session" && sub === "urge") ||
    (top === "support" && sub === "sos");

  if (hidden) return null;

  const go = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    router.push("/session/urge" as any);
  };

  return (
    <View
      pointerEvents="box-none"
      style={{ position: "absolute", left: 0, right: 0, bottom: insets.bottom + 12, alignItems: "center" }}
    >
      <Pressable
        onPress={go}
        accessibilityRole="button"
        accessibilityLabel="I need a drink — urge support"
        hitSlop={10}
        style={{
          paddingHorizontal: 22,
          paddingVertical: 11,
          borderRadius: 24,
          backgroundColor: "#A489DE",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.35)",
          shadowColor: "#000",
          shadowOpacity: 0.4,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 4 },
          elevation: 6,
        }}
        className="active:opacity-85"
      >
        <Text style={{ fontFamily: "Bungee", fontSize: 20, lineHeight: 24, color: "#1a1622", letterSpacing: 0.5 }}>
          I need a drink
        </Text>
      </Pressable>
    </View>
  );
}
