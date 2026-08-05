import React from "react";
import { View, Text, Pressable, ScrollView, Image, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import { CompanionArt } from "@/components/ui/CompanionArt";
import { PauseModal } from "@/components/home/PauseModal";
import { useSmartReminder } from "@/hooks/useSmartReminder";
import { useWidgetSync } from "@/hooks/useWidgetSync";
import { useDrinkIntentSync } from "@/hooks/useDrinkIntentSync";
import { useActiveSession } from "@/hooks/useDrinkingSession";
import { useCompanion } from "@/hooks/useCompanion";

/**
 * Home — you don't open a menu, you walk into the café. One 90s room, and every
 * destination is a thing you move toward: the door to your room, the curtain to
 * Support, the counter for a drink, the arcade, the papers on the rack, the
 * A-frame for Community. The companion stands behind the counter (bust pose) by
 * the phone. Same engine as The Bar/Me: baked room, sized to the screen,
 * hand-lettered doorways on top; the companion is superposed so one café serves
 * every character. Positions come from Marta's labelled layout — each is a
 * fraction, so nudging one is a one-number change.
 */

const SCREEN_W = Dimensions.get("window").width;
const ROOM = require("../../assets/scenes/cafe_home.png");
const ROOM_W = 853;
const ROOM_H = 1844;
const IMG_H = SCREEN_W * (ROOM_H / ROOM_W);

type Spot = { key: string; text: string; route: string; x: number; y: number; warn?: boolean };

const SPOTS: Spot[] = [
  { key: "me", text: "Me", route: "/(tabs)/profile", x: 0.27, y: 0.265 },        // the door
  { key: "support", text: "Support", route: "/(tabs)/support", x: 0.45, y: 0.25 }, // the curtain
  { key: "bar", text: "The Bar", route: "/barista", x: 0.63, y: 0.205 },          // the counter/fridge
  { key: "games", text: "Games\nArcade", route: "/session/games", x: 0.85, y: 0.31 }, // the cabinet
  { key: "reading", text: "Reading\nCorner", route: "/toolkit", x: 0.16, y: 0.40 }, // shelf/armchair
  { key: "writing", text: "Writing\nSpace", route: "/(tabs)/journal", x: 0.10, y: 0.52 }, // the desk
  { key: "today", text: "Today", route: "/today", x: 0.71, y: 0.44 },             // the ledger on the counter
  { key: "urge", text: "I need a drink", route: "/session/urge", x: 0.61, y: 0.555, warn: true }, // counter front
  { key: "community", text: "Community", route: "/community", x: 0.33, y: 0.755 }, // the A-frame
  { key: "gazette", text: "The Gazette", route: "/soul", x: 0.155, y: 0.685 },     // rack, top tier
  { key: "funnies", text: "The Funnies", route: "/giggles", x: 0.155, y: 0.78 },   // rack, middle
  { key: "letters", text: "The Letters", route: "/thought", x: 0.155, y: 0.875 },  // rack, bottom
];

// The companion, bust pose, standing behind the counter by the phone. Cropped
// so only head-and-shoulders rise above the counter — reads as *behind* it.
const COMP = { xCenter: 0.51, topY: 0.26, width: 0.34, cropFrac: 0.42, wh: 630 / 420 };

function RoomLabel({ spot, onPress }: { spot: Spot; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={16}
      accessibilityRole="button"
      accessibilityLabel={spot.text.replace("\n", " ")}
      style={{
        position: "absolute",
        left: spot.x * SCREEN_W,
        top: spot.y * IMG_H,
        transform: [{ translateX: -62 }],
        width: 124,
        alignItems: "center",
        ...(spot.warn
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
          lineHeight: 25,
          color: "#F0EBF5",
          textAlign: "center",
          textShadowColor: "rgba(0,0,0,0.95)",
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 7,
        }}
      >
        {spot.text}
      </Text>
    </Pressable>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { pose } = useCompanion();
  const { data: activeSession } = useActiveSession();

  useSmartReminder();
  useWidgetSync();
  useDrinkIntentSync();

  const go = (route: string, warn = false) => {
    if (warn) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(route as any);
  };

  const compW = COMP.width * SCREEN_W;
  const compFullH = compW * COMP.wh;
  const compCropH = COMP.cropFrac * SCREEN_W;

  return (
    <View style={{ flex: 1, backgroundColor: "#0d0b12" }}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        <View style={{ width: SCREEN_W, height: IMG_H, position: "relative" }}>
          <Image source={ROOM} style={{ width: SCREEN_W, height: IMG_H }} resizeMode="cover" />

          {/* The companion behind the counter — tap them (or the phone) for Resources. */}
          <Pressable
            onPress={() => go("/support/resources")}
            hitSlop={8}
            style={{
              position: "absolute",
              left: COMP.xCenter * SCREEN_W - compW / 2,
              top: COMP.topY * IMG_H,
              width: compW,
              height: compCropH,
            }}
          >
            <CompanionArt source={pose("bust")} width={compW} height={compFullH} cropHeight={compCropH} />
          </Pressable>

          {SPOTS.map((s) => (
            <RoomLabel key={s.key} spot={s} onPress={() => go(s.route, s.warn)} />
          ))}
        </View>
      </ScrollView>

      {/* If a session's live, keep it one tap away without cluttering the room. */}
      {activeSession ? (
        <Pressable
          onPress={() => router.push("/session/track")}
          className="active:opacity-80"
          style={{ position: "absolute", top: 54, left: 14, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: "rgba(6,7,8,0.85)", borderWidth: 1, borderColor: "rgba(236,233,241,0.16)" }}
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
