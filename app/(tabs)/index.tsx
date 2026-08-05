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

// Positions are Marta's exact crosses (x%, y% of the image → fractions).
// PREVIEW spots (gazette/funnies/letters/community) sit here as labels for now;
// the live content previews are the follow-up build.
const SPOTS: Spot[] = [
  { key: "support", text: "Support", route: "/(tabs)/support", x: 0.506, y: 0.145 },   // plaque above curtain
  { key: "me", text: "Me", route: "/(tabs)/profile", x: 0.388, y: 0.221 },             // small hanging frame
  { key: "bar", text: "The Bar", route: "/barista", x: 0.668, y: 0.223 },              // top of fridge
  { key: "reading", text: "Reading\nCorner", route: "/toolkit", x: 0.225, y: 0.260 },  // corkboard, left wall
  { key: "games", text: "Games\nArcade", route: "/session/games", x: 0.868, y: 0.327 }, // arcade screen
  { key: "writing", text: "Writing\nSpace", route: "/(tabs)/journal", x: 0.090, y: 0.356 }, // purple wall panel
  { key: "resources", text: "Resources", route: "/support/resources", x: 0.576, y: 0.385 }, // telephone
  { key: "tonight", text: "Tonight", route: "/session/track", x: 0.702, y: 0.424 },    // notebook / ledger
  { key: "gazette", text: "The Gazette", route: "/soul", x: 0.147, y: 0.613 },         // top basket (PREVIEW)
  { key: "funnies", text: "The Funnies", route: "/giggles", x: 0.165, y: 0.700 },      // middle basket (PREVIEW)
  { key: "community", text: "Community", route: "/community", x: 0.393, y: 0.704 },    // A-frame (PREVIEW)
  { key: "letters", text: "The Letters", route: "/thought", x: 0.175, y: 0.783 },      // bottom basket (PREVIEW)
];

// The companion, bust pose, behind the counter by the phone. Dropped so the
// waist meets the counter line — reads as standing *behind* it. Tune: raise
// topY to lift her, raise cropFrac to bring the cut-off (waist) lower.
const COMP = { xCenter: 0.52, topY: 0.29, width: 0.36, cropFrac: 0.44, wh: 630 / 420 };

function RoomLabel({ spot, onPress }: { spot: Spot; onPress: () => void }) {
  // Anchor to the cross, but tuck edge labels in so they never clip off-screen.
  const align = spot.x <= 0.2 ? "left" : spot.x >= 0.8 ? "right" : "center";
  const base: any = { position: "absolute", top: spot.y * IMG_H };
  if (align === "center") {
    base.left = spot.x * SCREEN_W;
    base.transform = [{ translateX: -62 }];
    base.width = 124;
    base.alignItems = "center";
  } else if (align === "left") {
    base.left = spot.x * SCREEN_W - 6;
    base.alignItems = "flex-start";
  } else {
    base.right = (1 - spot.x) * SCREEN_W - 6;
    base.alignItems = "flex-end";
  }
  if (spot.warn) {
    base.backgroundColor = "rgba(59,51,82,0.85)";
    base.borderWidth = 1;
    base.borderColor = "rgba(190,160,210,0.55)";
    base.borderRadius = 20;
    base.paddingVertical = 5;
    base.paddingHorizontal = 14;
  }
  return (
    <Pressable
      onPress={onPress}
      hitSlop={16}
      accessibilityRole="button"
      accessibilityLabel={spot.text.replace("\n", " ")}
      style={base}
      className="active:opacity-70"
    >
      <Text
        style={{
          fontFamily: "SkinnyCustard",
          fontSize: 22,
          lineHeight: 25,
          color: "#F0EBF5",
          textAlign: align === "left" ? "left" : align === "right" ? "right" : "center",
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

          {/* "I need a drink" — one line, stretched across the counter front. */}
          <Pressable
            onPress={() => go("/session/urge", true)}
            hitSlop={8}
            style={{
              position: "absolute",
              left: 0.45 * SCREEN_W,
              right: 0.035 * SCREEN_W,
              top: 0.585 * IMG_H,
              backgroundColor: "rgba(59,51,82,0.82)",
              borderWidth: 1,
              borderColor: "rgba(190,160,210,0.6)",
              borderRadius: 12,
              paddingVertical: 8,
              alignItems: "center",
            }}
            className="active:opacity-80"
          >
            <Text
              style={{
                fontFamily: "SkinnyCustard",
                fontSize: 25,
                color: "#F0EBF5",
                textShadowColor: "rgba(0,0,0,0.9)",
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 6,
              }}
            >
              I need a drink
            </Text>
          </Pressable>
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
