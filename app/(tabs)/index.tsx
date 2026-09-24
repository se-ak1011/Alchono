import React from "react";
import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { AdventureHub } from "@/components/home/AdventureHub";
import { PauseModal } from "@/components/home/PauseModal";
import { useSmartReminder } from "@/hooks/useSmartReminder";
import { useWidgetSync } from "@/hooks/useWidgetSync";
import { useDrinkIntentSync } from "@/hooks/useDrinkIntentSync";
import { useActiveSession } from "@/hooks/useDrinkingSession";

/**
 * Home — the 00s CD-ROM adventure hub. You don't open a menu, you walk into a
 * place: the café is the first-person viewpoint, and every destination is a
 * hotspot in the scene (its name shows in the caption bar, LucasArts-style)
 * rather than a floating label. The whole hub is described by data in
 * `src/data/hubScene.ts`, so Marta's redrawn 00s art drops straight in — swap
 * the image, nudge a few coordinates, no engine changes. The current scenes
 * are placeholders standing in until the period art lands.
 */
export default function HomeScreen() {
  const router = useRouter();
  const { data: activeSession } = useActiveSession();

  useSmartReminder();
  useWidgetSync();
  useDrinkIntentSync();

  return (
    <View style={{ flex: 1, backgroundColor: "#0d0b12" }}>
      <AdventureHub />

      {/* If a session's live, keep it one tap away without cluttering the room. */}
      {activeSession ? (
        <Pressable
          onPress={() => router.push("/session/track")}
          className="active:opacity-80"
          style={{
            position: "absolute",
            top: 54,
            left: 14,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: 20,
            backgroundColor: "rgba(6,7,8,0.85)",
            borderWidth: 1,
            borderColor: "rgba(236,233,241,0.16)",
          }}
        >
          <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: "#C98282" }} />
          <Text style={{ color: "#D9D4E4", fontSize: 13, fontWeight: "500" }}>Session on</Text>
          <Feather name="chevron-right" size={14} color="#817B91" />
        </Pressable>
      ) : null}

      <PauseModal />
    </View>
  );
}
