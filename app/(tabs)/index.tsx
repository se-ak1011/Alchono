import React from "react";
import { View, Text, Pressable, ScrollView, Image, Dimensions, Platform } from "react-native";
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
import { useCommunityMoments, type FeedMoment } from "@/hooks/useMoments";

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
const MONO = Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }) as string;

type Spot = { key: string; text: string; route: string; x: number; y: number; warn?: boolean; preview?: boolean };

// Positions are Marta's exact crosses (x%, y% of the image → fractions).
// The papers (gazette/funnies/letters) and Community have LEFT this list — they
// now render as live previews below (see RACK + LookPreview).
const SPOTS: Spot[] = [
  { key: "support", text: "Support", route: "/(tabs)/support", x: 0.506, y: 0.145 },   // plaque above curtain
  { key: "me", text: "Me", route: "/(tabs)/profile", x: 0.345, y: 0.255 },             // #5 — in the doorway, like a door label
  { key: "bar", text: "The Bar", route: "/barista", x: 0.745, y: 0.225 },              // #4 — over the smaller (coffee) unit so it doesn't cover the drinks
  { key: "reading", text: "Reading\nCorner", route: "/toolkit", x: 0.215, y: 0.195 },  // #6 — on the wall board
  { key: "games", text: "Games\nArcade", route: "/session/games", x: 0.905, y: 0.250 }, // #3 — on the board above the arcade
  { key: "writing", text: "Writing\nSpace", route: "/(tabs)/journal", x: 0.085, y: 0.270 }, // #7 — on the far-left board
  { key: "resources", text: "Resources", route: "/support/resources", x: 0.556, y: 0.430 }, // #2 — dropped a touch so the phone shows
  { key: "tonight", text: "Tonight", route: "/session/track", x: 0.702, y: 0.424 },    // notebook / ledger
];

// #9/#10/#11 — the three papers, now little cards tucked in the rack baskets
// instead of text labels. Each number is a fraction: x/y = top-left in the
// basket, w = width, rotate = lean to match the rack. Nudge any one number.
type RackPaper = { route: string; masthead: string; kicker: string; paper: string; ink: string; x: number; y: number; w: number; rotate: number };
const RACK: RackPaper[] = [
  { route: "/soul",    masthead: "The Good News Gazette", kicker: "GOOD NEWS", paper: "#e7e1d2", ink: "#2b2620", x: 0.040, y: 0.595, w: 0.27, rotate: -7 }, // #9  top basket
  { route: "/giggles", masthead: "The Funny Pages",       kicker: "A LAUGH",   paper: "#e9dfe4", ink: "#33262e", x: 0.050, y: 0.675, w: 0.27, rotate: -7 }, // #10 middle basket
  { route: "/thought", masthead: "The Letters Page",      kicker: "A DILEMMA", paper: "#d8e0dd", ink: "#24302c", x: 0.060, y: 0.755, w: 0.27, rotate: -7 }, // #11 bottom basket
];

// #12 — Community: the label sits at the top of the A-frame corkboard, with a
// couple of the latest Look prints pinned beneath it. Tune this box to the
// corkboard; the companion (#8) may sit in front until they're placed.
const CORK = { x: 0.255, y: 0.625, w: 0.235, gap: 6 };

// The companion, standing pose (full body), greeting you in the room — feet on
// the floor. Tune: xCenter moves her left/right, feetY sets where her feet land,
// width scales her.
const COMP = { xCenter: 0.40, feetY: 0.80, width: 0.44, wh: 630 / 420 };

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
          fontSize: 12,
          lineHeight: 14,
          color: "#FFFFFF",
          textTransform: "uppercase",
          textAlign: align === "left" ? "left" : align === "right" ? "right" : "center",
          // Kept a soft shadow so the smaller white lettering stays legible
          // against the lighter patches of the scene without shouting.
          textShadowColor: "rgba(0,0,0,0.9)",
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 5,
        }}
      >
        {spot.text}
      </Text>
    </Pressable>
  );
}

// #9/#10/#11 — a compact paper card that sits in a rack basket (mini masthead +
// kicker), tapping through to its read. Same paper tints/ink as The Caff.
function RackCard({ p, onPress }: { p: RackPaper; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={p.masthead}
      className="active:opacity-90"
      style={{ position: "absolute", left: p.x * SCREEN_W, top: p.y * IMG_H, width: p.w * SCREEN_W, transform: [{ rotate: `${p.rotate}deg` }] }}
    >
      <View
        style={{
          backgroundColor: p.paper,
          borderRadius: 3,
          paddingHorizontal: 8,
          paddingTop: 5,
          paddingBottom: 6,
          shadowColor: "#000",
          shadowOpacity: 0.5,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 3 },
          elevation: 4,
        }}
      >
        <Text numberOfLines={1} style={{ fontFamily: MONO, fontSize: 6.5, letterSpacing: 1, color: "rgba(0,0,0,0.5)" }}>{p.kicker}</Text>
        <View style={{ height: 1, backgroundColor: "rgba(0,0,0,0.25)", marginVertical: 2 }} />
        <Text numberOfLines={1} style={{ fontSize: 11, lineHeight: 13, color: p.ink, fontFamily: Platform.select({ ios: "Georgia", default: "serif" }), fontWeight: "700" }}>
          {p.masthead}
        </Text>
      </View>
    </Pressable>
  );
}

// A tiny Look print, pinned to the corkboard — same cream-frame look as the
// Community wall, shrunk to a thumbnail.
function MiniPrint({ m, i, onPress }: { m: FeedMoment; i: number; onPress: () => void }) {
  const isVideo = m.media_type === "video";
  const src = isVideo ? m.thumb_url : m.url;
  const tilt = i % 2 === 0 ? -3 : 3;
  return (
    <Pressable onPress={onPress} hitSlop={6} className="active:opacity-90" style={{ flex: 1, transform: [{ rotate: `${tilt}deg` }] }}>
      <View
        style={{
          backgroundColor: "#e7e1d5",
          borderRadius: 2,
          padding: 2.5,
          paddingBottom: 4,
          shadowColor: "#000",
          shadowOpacity: 0.4,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: 2 },
        }}
      >
        {src ? (
          <Image source={{ uri: src }} style={{ width: "100%", aspectRatio: 1, borderRadius: 1, backgroundColor: "#201D28" }} resizeMode="cover" />
        ) : (
          <View style={{ width: "100%", aspectRatio: 1, borderRadius: 1, backgroundColor: "#201D28" }} />
        )}
        {isVideo ? (
          <View style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0, alignItems: "center", justifyContent: "center" }}>
            <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center" }}>
              <Feather name="play" size={9} color="#fff" style={{ marginLeft: 1 }} />
            </View>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

// #12 — Community on the corkboard: hand-lettered label up top (taps through to
// Community), a peek at the latest Look prints beneath.
function LookPreview({ onOpen }: { onOpen: () => void }) {
  const { data: moments } = useCommunityMoments();
  const shots = (moments ?? []).slice(0, 2);
  return (
    <View style={{ position: "absolute", left: CORK.x * SCREEN_W, top: CORK.y * IMG_H, width: CORK.w * SCREEN_W, alignItems: "center" }}>
      <Pressable onPress={onOpen} hitSlop={12} accessibilityRole="button" accessibilityLabel="Community">
        <Text
          style={{
            fontFamily: "SkinnyCustard",
            fontSize: 12,
            lineHeight: 14,
            color: "#FFFFFF",
            textTransform: "uppercase",
            textShadowColor: "rgba(0,0,0,0.9)",
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 5,
          }}
        >
          Community
        </Text>
      </Pressable>
      {shots.length ? (
        <View style={{ flexDirection: "row", gap: CORK.gap, marginTop: 5, width: "100%" }}>
          {shots.map((m, i) => (
            <MiniPrint key={m.id} m={m} i={i} onPress={onOpen} />
          ))}
        </View>
      ) : null}
    </View>
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
  const compH = compW * COMP.wh;
  const compTop = COMP.feetY * IMG_H - compH;

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
              top: compTop,
              width: compW,
              height: compH,
            }}
          >
            <CompanionArt source={pose("standing")} width={compW} height={compH} />
          </Pressable>

          {SPOTS.map((s) => (
            <RoomLabel key={s.key} spot={s} onPress={() => go(s.route, s.warn)} />
          ))}

          {/* #9/#10/#11 — the three papers as little cards in the rack baskets. */}
          {RACK.map((p) => (
            <RackCard key={p.route} p={p} onPress={() => go(p.route)} />
          ))}

          {/* #12 — Community label + a peek at the Look wall, on the corkboard. */}
          <LookPreview onOpen={() => go("/community")} />

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
                textTransform: "uppercase",
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
