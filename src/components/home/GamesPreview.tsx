import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, Pressable, Platform, Dimensions } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

const MONO = Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }) as string;
const PLUM = "#A489DE";
const { width: SCREEN_W } = Dimensions.get("window");
const BOARD = Math.min(SCREEN_W - 80, 300);
const GAP = 10;

type Round = { dim: number; oddIndex: number; base: string; odd: string };

// A calm Odd-One-Out round — same idea as the full game, but a fixed, roomy
// grid so the difference reads from across the room. Never cruel.
function makeRound(): Round {
  const dim = 3;
  const hue = Math.floor(Math.random() * 360);
  const sat = 42 + Math.floor(Math.random() * 16);
  const light = 46 + Math.floor(Math.random() * 12);
  const oddLight = light > 55 ? light - 14 : light + 14;
  return {
    dim,
    oddIndex: Math.floor(Math.random() * dim * dim),
    base: `hsl(${hue}, ${sat}%, ${light}%)`,
    odd: `hsl(${hue}, ${sat}%, ${oddLight}%)`,
  };
}

/**
 * The Games Arcade, peeked from the café. It plays a self-running Odd-One-Out
 * demo — tap the different tile and it rolls a new one, or it re-rolls on its
 * own so the board always looks alive. "Enter the arcade" opens the full room.
 */
export function GamesPreview({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [round, setRound] = useState<Round>(() => makeRound());
  const [key, setKey] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cell = useMemo(() => (BOARD - GAP * (round.dim - 1)) / round.dim, [round.dim]);

  const roll = (fromTap: boolean) => {
    if (fromTap) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setRound(makeRound());
    setKey((k) => k + 1);
  };

  // Auto re-roll so the demo animates even untouched. Reset on every round.
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => roll(false), 1900);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [key]);

  const go = (path: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
    router.push(path as any);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#201D28", paddingTop: insets.top + 10 }}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, marginBottom: 6 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: "PatrickHand", fontSize: 22, color: "#ECE9F1" }}>Games Arcade</Text>
          <Text style={{ fontFamily: MONO, fontSize: 11.5, color: "#817B91", marginTop: 3 }}>something else to hold onto</Text>
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

      {/* The living board */}
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 20 }}>
        <Text style={{ fontFamily: MONO, fontSize: 11, color: "#6f6880", letterSpacing: 1 }}>
          one shade is different — tap it
        </Text>
        <Animated.View
          key={`round-${key}`}
          entering={FadeIn.duration(260)}
          style={{ width: BOARD, flexDirection: "row", flexWrap: "wrap", gap: GAP }}
        >
          {Array.from({ length: round.dim * round.dim }, (_, i) => (
            <Pressable key={i} onPress={() => roll(i === round.oddIndex)}>
              <View
                style={{
                  width: cell,
                  height: cell,
                  borderRadius: Math.max(12, cell / 5),
                  backgroundColor: i === round.oddIndex ? round.odd : round.base,
                }}
              />
            </Pressable>
          ))}
        </Animated.View>
      </View>

      {/* Enter */}
      <View style={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 24, gap: 12 }}>
        <Pressable
          onPress={() => go("/session/games")}
          className="active:opacity-85"
          style={{ alignSelf: "center", paddingHorizontal: 24, paddingVertical: 13, borderRadius: 24, backgroundColor: PLUM }}
        >
          <Text style={{ fontFamily: "PatrickHand", fontSize: 15, color: "#1a1622" }}>Enter the arcade</Text>
        </Pressable>
        <Text style={{ fontFamily: MONO, fontSize: 10.5, color: "#6f6880", textAlign: "center" }}>
          memory · pattern · odd one out · colour · word search
        </Text>
      </View>
    </View>
  );
}
