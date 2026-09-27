import React, { useMemo } from "react";
import { View, Text, Pressable, Platform } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { ConstellationSky } from "@/components/constellation/ConstellationSky";
import { useAfDays } from "@/hooks/useVictories";
import { useAuthStore } from "@/store/authStore";
import { buildSky, currentMilestone } from "@/lib/constellation";

const MONO = Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }) as string;
const PLUM = "#A489DE";

/**
 * My Sky, peeked from the café — the real constellation on the board. Every
 * alcohol-free day is a lit star; the rest of the field waits, already there.
 * Tapping a star (or "Open your sky") drops into the full room.
 */
export function SkyPreview({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: dates = [] } = useAfDays();
  const userId = useAuthStore((s) => s.user?.id) ?? "anon";
  const sky = useMemo(() => buildSky(dates, userId), [dates, userId]);
  const milestone = currentMilestone(dates.length);

  const open = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
    router.push("/constellation");
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#201D28", paddingTop: insets.top + 10 }}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "flex-start", paddingHorizontal: 20, marginBottom: 6 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: "PatrickHand", fontSize: 22, color: "#ECE9F1" }}>My Sky</Text>
          <Text style={{ fontFamily: MONO, fontSize: 11.5, color: "#817B91", marginTop: 3 }}>
            {dates.length === 0
              ? "mark a day and the first star lights"
              : `${dates.length} ${dates.length === 1 ? "star" : "stars"} shining`}
          </Text>
        </View>
        <Pressable
          onPress={onClose}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Close preview"
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(255,255,255,0.06)",
            borderWidth: 1,
            borderColor: "rgba(236,233,241,0.14)",
          }}
        >
          <Feather name="x" size={20} color="#EFEAF5" />
        </Pressable>
      </View>

      {/* The sky itself — same canvas as the full room. Any star tap opens it. */}
      <View style={{ flex: 1 }}>
        <ConstellationSky sky={sky} onSelectStar={open} />
      </View>

      {/* Open */}
      <View style={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 24, alignItems: "center", gap: 10 }}>
        {milestone ? (
          <Text style={{ color: "#9d96ad", fontSize: 12.5, fontStyle: "italic", textAlign: "center" }}>{milestone}</Text>
        ) : null}
        <Pressable
          onPress={open}
          className="active:opacity-85"
          style={{ paddingHorizontal: 24, paddingVertical: 13, borderRadius: 24, backgroundColor: PLUM }}
        >
          <Text style={{ fontFamily: "PatrickHand", fontSize: 15, color: "#1a1622" }}>Open your sky</Text>
        </Pressable>
      </View>
    </View>
  );
}
