import React from "react";
import { View, Text, Pressable, ScrollView, Image, Dimensions } from "react-native";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CompanionArt } from "@/components/ui/CompanionArt";
import { useUnreadTotal } from "@/hooks/useMessages";
import { useCompanion } from "@/hooks/useCompanion";

/**
 * Support — a room you walk into: the tea-room from the flat, her pouring at
 * the island, the destinations hand-lettered onto the things around her (the
 * sofa, the shelf, the side lamp, the coffee table, the stool). Same engine as
 * The Bar and Me: one baked room, sized to the screen, links positioned on top.
 * The companion is superposed (one room serves every character).
 *
 * Positions come from Marta's A–G / 1–15 grid; centres are fractions, so a note
 * like "move Community left" is a one-number change.
 */

const SCREEN_W = Dimensions.get("window").width;
const ROOM = require("../../assets/scenes/support_room.png");
const ROOM_W = 853;
const ROOM_H = 1844;
const IMG_H = SCREEN_W * (ROOM_H / ROOM_W);

type Label = { key: string; text: string; route: string; x: number; y: number; warn?: boolean };

// Object centres from the grid (fractions of the image).
const LABELS: Label[] = [
  { key: "coach", text: "AI Coach", route: "/support/coach", x: 0.34, y: 0.47 },       // sofa  B7–E10
  { key: "community", text: "Community", route: "/community", x: 0.85, y: 0.42 },       // right shelf/stereo F4–G9
  { key: "recovery", text: "Recovery", route: "/support/recovery", x: 0.12, y: 0.44 }, // side table+lamp A6–B8
  { key: "resources", text: "Resources", route: "/support/resources", x: 0.18, y: 0.62 }, // coffee table A9–C10
  { key: "urge", text: "I want a drink", route: "/session/urge", x: 0.44, y: 0.84, warn: true }, // stool C11–D14
];

// The tea companion, pouring at the island (counter top ≈ row 8, y≈0.47).
const COMP = { xCenter: 0.45, bottomY: 0.5, width: 0.5, wh: 458 / 348 };

function RoomLabel({ label, onPress }: { label: Label; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={16}
      accessibilityRole="button"
      accessibilityLabel={label.text}
      style={{
        position: "absolute",
        left: label.x * SCREEN_W,
        top: label.y * IMG_H,
        transform: [{ translateX: -60 }],
        width: 120,
        alignItems: "center",
        ...(label.warn
          ? {
              backgroundColor: "rgba(59,51,82,0.85)",
              borderWidth: 1,
              borderColor: "rgba(190,160,210,0.55)",
              borderRadius: 20,
              paddingVertical: 5,
            }
          : {}),
      }}
      className="active:opacity-70"
    >
      <Text
        style={{
          fontFamily: "SkinnyCustard",
          fontSize: 22,
          lineHeight: 26,
          color: "#F0EBF5",
          textAlign: "center",
          textShadowColor: "rgba(0,0,0,0.95)",
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 7,
        }}
      >
        {label.text}
      </Text>
    </Pressable>
  );
}

export default function SupportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { pose } = useCompanion();
  const { data: unread } = useUnreadTotal();

  const compW = COMP.width * SCREEN_W;
  const compH = compW * COMP.wh;

  const go = (route: string, warn = false) => {
    if (warn) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(route as any);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#0d0b12" }}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        <View style={{ width: SCREEN_W, height: IMG_H, position: "relative" }}>
          <Image source={ROOM} style={{ width: SCREEN_W, height: IMG_H }} resizeMode="cover" />

          {/* Her, pouring at the island. */}
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              left: COMP.xCenter * SCREEN_W - compW / 2,
              top: COMP.bottomY * IMG_H - compH,
              width: compW,
              height: compH,
            }}
          >
            <CompanionArt source={pose("tea")} width={compW} height={compH} />
          </View>

          {LABELS.map((l) => (
            <RoomLabel key={l.key} label={l} onPress={() => go(l.route, l.warn)} />
          ))}
        </View>
      </ScrollView>

      {/* Header scrim + controls over the room. */}
      <LinearGradient
        pointerEvents="none"
        colors={["rgba(13,11,18,0.72)", "rgba(13,11,18,0)"]}
        style={{ position: "absolute", top: 0, left: 0, right: 0, height: insets.top + 72 }}
      />
      <View style={{ position: "absolute", top: insets.top + 6, left: 12, right: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Pressable onPress={() => router.back()} hitSlop={12} className="p-1 active:opacity-60">
            <Feather name="chevron-left" size={26} color="#ECE9F1" />
          </Pressable>
          <Text style={{ fontFamily: "SkinnyCustard", fontSize: 30, color: "#ECE9F1" }}>Support</Text>
        </View>
        <Pressable
          onPress={() => go("/messages")}
          hitSlop={8}
          style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(30,26,38,0.8)", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" }}
        >
          <Text style={{ color: "#D9D4E4", fontSize: 13, fontWeight: "500" }}>Messages</Text>
          {!!unread && (
            <View style={{ backgroundColor: "#A489DE", borderRadius: 9, minWidth: 18, height: 18, paddingHorizontal: 5, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ color: "#201D28", fontSize: 11, fontWeight: "800" }}>{unread}</Text>
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
}
