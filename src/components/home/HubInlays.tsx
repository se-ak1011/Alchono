import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, Image, StyleSheet, Platform, type LayoutChangeEvent } from "react-native";
import Svg, { Circle, Line as SvgLine, Defs, LinearGradient, RadialGradient, Stop, Rect } from "react-native-svg";
import { useCommunityMoments, useMyMoments } from "@/hooks/useMoments";
import { useCommunityFeed } from "@/hooks/useCommunity";
import { useConnections } from "@/hooks/useMessages";
import { BOOKS } from "@/data/books";
import type { ToolkitCategory } from "@/lib/toolkit";
import { WebView } from "react-native-webview";
import { ARCADE_GAMES } from "@/data/arcadeGames";
import { useAfDays } from "@/hooks/useVictories";
import { useAuthStore } from "@/store/authStore";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

/**
 * "Inlays" — live content painted straight onto an object in the scene, so the
 * café itself is alive: the arcade screen is running a game, the board carries
 * real posts, the rack holds today's papers. Unlike the old pop-up previews,
 * these are always on and never intercept a tap — the hotspot they sit inside
 * routes you straight into the real room. Each fills its hotspot box (the engine
 * clips + rotates it to sit on the object), and must render at any small size.
 *
 * Every inlay is pointer-transparent (the wrapper in AdventureHub sets
 * pointerEvents="none"), so taps always reach the object underneath.
 */

const MONO = Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }) as string;

// ————————————————————————————————————————————————————————————————
// Arcade — a self-running Odd One Out on the cabinet screen. Rolls on its own
// so the machine always looks switched on and mid-game.
// ————————————————————————————————————————————————————————————————
type Round = { odd: number; base: string; odd_c: string };
function makeRound(): Round {
  const hue = Math.floor(Math.random() * 360);
  const sat = 55 + Math.floor(Math.random() * 20);
  const light = 46 + Math.floor(Math.random() * 12);
  const oddLight = light > 55 ? light - 16 : light + 16;
  return { odd: Math.floor(Math.random() * 9), base: `hsl(${hue}, ${sat}%, ${light}%)`, odd_c: `hsl(${hue}, ${sat}%, ${oddLight}%)` };
}

export function ArcadeInlay() {
  const [round, setRound] = useState<Round>(() => makeRound());
  useEffect(() => {
    const t = setInterval(() => setRound(makeRound()), 1600);
    return () => clearInterval(t);
  }, []);
  // Translucent so the cabinet's own screen shows through — it reads as a game
  // glowing on the glass, not an opaque panel stuck over it.
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(10,8,18,0.22)", alignItems: "center", justifyContent: "center", overflow: "hidden" }]}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(164,137,222,0.06)" }]} />
      <View style={{ width: "78%", aspectRatio: 1, flexDirection: "row", flexWrap: "wrap", opacity: 0.72 }}>
        {Array.from({ length: 9 }).map((_, i) => (
          <View key={i} style={{ width: "33.33%", height: "33.33%", padding: "3%" }}>
            <View style={{ flex: 1, borderRadius: 3, backgroundColor: i === round.odd ? round.odd_c : round.base }} />
          </View>
        ))}
      </View>
    </View>
  );
}

// ————————————————————————————————————————————————————————————————
// Community — the latest videos from the wall, playing on the board. Thumbnails
// (not text — text gets cut on a small board), stacked to fill.
// ————————————————————————————————————————————————————————————————
export function CommunityInlay() {
  const { data: moments } = useCommunityMoments();
  const videos = ((moments ?? []) as any[]).filter((m) => m.media_type === "video").slice(0, 2);
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: "#15111c", overflow: "hidden", gap: 2 }]}>
      {videos.length === 0 ? (
        <View style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center" }]}>
          <Text style={{ fontFamily: MONO, fontSize: 8, color: "rgba(214,201,240,0.5)" }}>videos soon</Text>
        </View>
      ) : (
        videos.map((m, i) => (
          <View key={m.id ?? i} style={{ flex: 1, overflow: "hidden" }}>
            {m.thumb_url ? (
              <Image source={{ uri: m.thumb_url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            ) : (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: "#241d30" }]} />
            )}
            {/* play glyph — a CSS triangle, no icon dependency */}
            <View style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center" }]}>
              <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center" }}>
                <View style={{ width: 0, height: 0, borderTopWidth: 4, borderBottomWidth: 4, borderLeftWidth: 6, borderTopColor: "transparent", borderBottomColor: "transparent", borderLeftColor: "#fff", marginLeft: 2 }} />
              </View>
            </View>
          </View>
        ))
      )}
    </View>
  );
}

// ————————————————————————————————————————————————————————————————
// Community board — the latest WRITTEN posts, chalked onto the break-room
// board. PatrickHand reads as handwriting on the blackboard; transparent so the
// drawn board shows through.
// ————————————————————————————————————————————————————————————————
export function CommunityBoardInlay() {
  const { data } = useCommunityFeed();
  const posts = ((data?.pages?.[0] ?? []) as any[]).filter((p) => p?.content).slice(0, 3);
  return (
    <View style={[StyleSheet.absoluteFill, { overflow: "hidden", paddingHorizontal: "7%", paddingVertical: "6%", justifyContent: "center" }]}>
      {posts.length === 0 ? (
        <Text style={{ fontFamily: "PatrickHand", fontSize: 13, color: "rgba(242,244,238,0.55)", textAlign: "center" }}>
          the wall's quiet — start a thread
        </Text>
      ) : (
        posts.map((p, i) => (
          <View key={p.id ?? i} style={{ marginBottom: "5%" }}>
            <Text numberOfLines={2} style={{ fontFamily: "PatrickHand", fontSize: 13, lineHeight: 16, color: "rgba(244,244,238,0.92)" }}>
              “{p.content}”
            </Text>
            <Text numberOfLines={1} style={{ fontFamily: "PatrickHand", fontSize: 11, color: "rgba(198,222,208,0.62)" }}>
              — @{p.username ?? "anon"}
            </Text>
          </View>
        ))
      )}
    </View>
  );
}

// ————————————————————————————————————————————————————————————————
// Your moments — your latest photos, pinned to the Me-room corkboard like real
// snaps. Little white frames at a jaunty angle with a pin; the cork shows
// through. Tapping the board opens the full moments room.
// ————————————————————————————————————————————————————————————————
export function MomentsBoardInlay() {
  const { data } = useMyMoments();
  const items = ((data ?? []) as any[]).filter((m) => m.url).slice(0, 3);
  return (
    <View style={[StyleSheet.absoluteFill, { overflow: "hidden", flexDirection: "row", alignItems: "center", justifyContent: "center", paddingHorizontal: "8%", paddingVertical: "14%", gap: 6 }]}>
      {items.length === 0 ? (
        <Text style={{ fontFamily: "PatrickHand", fontSize: 13, color: "rgba(51,42,36,0.5)", textAlign: "center" }}>
          pin your moments here
        </Text>
      ) : (
        items.map((m, i) => (
          <View
            key={m.id ?? i}
            style={{
              flex: 1,
              maxWidth: "33%",
              aspectRatio: 0.82,
              backgroundColor: "#fdfaf3",
              padding: 3,
              borderRadius: 2,
              transform: [{ rotate: `${(i - 1) * 4}deg` }],
              shadowColor: "#000",
              shadowOpacity: 0.28,
              shadowRadius: 2,
              shadowOffset: { width: 0, height: 1 },
              elevation: 2,
            }}
          >
            <Image source={{ uri: m.url }} style={{ flex: 1, borderRadius: 1 }} resizeMode="cover" />
            {/* pin */}
            <View style={{ position: "absolute", top: -3, alignSelf: "center", width: 6, height: 6, borderRadius: 3, backgroundColor: "#b23b3b" }} />
          </View>
        ))
      )}
    </View>
  );
}

// ————————————————————————————————————————————————————————————————
// Arcade cabinets — one tiny self-running demo per game, for the screens in the
// arcade room. All translucent, so they read as a game glowing on the glass.
// (Odd One Out reuses ArcadeInlay above.)
// ————————————————————————————————————————————————————————————————
const SCREEN_BG = "rgba(10,8,18,0.22)";

export function MemoryInlay() {
  const [flip, setFlip] = useState<[number, number]>([0, 3]);
  useEffect(() => {
    const t = setInterval(() => {
      const a = Math.floor(Math.random() * 6);
      let b = Math.floor(Math.random() * 6);
      if (b === a) b = (b + 1) % 6;
      setFlip([a, b]);
    }, 1500);
    return () => clearInterval(t);
  }, []);
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: SCREEN_BG, alignItems: "center", justifyContent: "center", overflow: "hidden" }]}>
      <View style={{ width: "82%", height: "72%", flexDirection: "row", flexWrap: "wrap", opacity: 0.75 }}>
        {Array.from({ length: 6 }).map((_, i) => {
          const up = flip.includes(i);
          return (
            <View key={i} style={{ width: "33.33%", height: "50%", padding: "4%" }}>
              <View style={{ flex: 1, borderRadius: 3, backgroundColor: up ? "rgba(202,182,242,0.9)" : "rgba(92,80,122,0.6)", alignItems: "center", justifyContent: "center" }}>
                {up ? <View style={{ width: "38%", height: "38%", borderRadius: 99, backgroundColor: "#3a2f52" }} /> : null}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export function PatternInlay() {
  const [on, setOn] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setOn((o) => (o + 1) % 4), 700);
    return () => clearInterval(t);
  }, []);
  const cols = ["#5fbf6f", "#d95f6f", "#e6c24a", "#5f8fd9"];
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: SCREEN_BG, alignItems: "center", justifyContent: "center", overflow: "hidden" }]}>
      <View style={{ width: "74%", aspectRatio: 1, flexDirection: "row", flexWrap: "wrap", opacity: 0.78 }}>
        {cols.map((c, i) => (
          <View key={i} style={{ width: "50%", height: "50%", padding: "4%" }}>
            <View style={{ flex: 1, borderRadius: 6, backgroundColor: c, opacity: on === i ? 1 : 0.3 }} />
          </View>
        ))}
      </View>
    </View>
  );
}

const STROOP: ReadonlyArray<[string, string]> = [["RED", "#5f8fd9"], ["BLUE", "#5fbf6f"], ["GREEN", "#e6c24a"], ["GOLD", "#d95f6f"]];
export function ColourInlay() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % STROOP.length), 1200);
    return () => clearInterval(t);
  }, []);
  const [word, color] = STROOP[i];
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(10,8,18,0.3)", alignItems: "center", justifyContent: "center", overflow: "hidden", paddingHorizontal: "8%" }]}>
      <Text adjustsFontSizeToFit numberOfLines={1} style={{ fontFamily: MONO, fontWeight: "800", fontSize: 40, color, letterSpacing: 1 }}>
        {word}
      </Text>
    </View>
  );
}

const WGRID = ["C", "A", "L", "M", "O", "H", "P", "E", "R", "S", "T", "A", "B", "I", "N", "D"];
export function WordInlay() {
  const [row, setRow] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setRow((r) => (r + 1) % 4), 1100);
    return () => clearInterval(t);
  }, []);
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(10,8,18,0.28)", alignItems: "center", justifyContent: "center", overflow: "hidden" }]}>
      <View style={{ width: "82%", aspectRatio: 1, flexDirection: "row", flexWrap: "wrap", opacity: 0.85 }}>
        {WGRID.map((ch, i) => {
          const hot = Math.floor(i / 4) === row;
          return (
            <View key={i} style={{ width: "25%", height: "25%", alignItems: "center", justifyContent: "center" }}>
              <Text style={{ fontFamily: MONO, fontSize: 9, fontWeight: "700", color: hot ? "#E9DEFF" : "rgba(180,170,205,0.5)" }}>{ch}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ————————————————————————————————————————————————————————————————
// Sibling-app logos — transparent crests to hang on the reception doors.
// Rendered as a contained image filling the hotspot box, so the engine's
// rotate / tilt (depth) / size / brightness controls all apply, same as any
// inlay. Positioned + tuned in the editor, then exported.
// ————————————————————————————————————————————————————————————————
// PNG (not webp): transparent/alpha webp can silently fail to render on Android.
const CANNANO_LOGO = require("../../../assets/logos/cannano.png");
const COCANO_LOGO = require("../../../assets/logos/cocano.png");
const MEDANO_LOGO = require("../../../assets/logos/medano.png");
const NICONO_LOGO = require("../../../assets/logos/nicono.png");

function LogoInlay({ source }: { source: number }) {
  // Wrap in a sized View and give the Image explicit 100% dims (more reliable
  // than absoluteFill inside a transformed/flex parent on Android).
  return (
    <View style={{ flex: 1, width: "100%", height: "100%" }}>
      <Image source={source} style={{ width: "100%", height: "100%" }} resizeMode="contain" />
    </View>
  );
}
export function CannanoLogoInlay() { return <LogoInlay source={CANNANO_LOGO} />; }
export function CocanoLogoInlay() { return <LogoInlay source={COCANO_LOGO} />; }
export function MedanoLogoInlay() { return <LogoInlay source={MEDANO_LOGO} />; }
export function NiconoLogoInlay() { return <LogoInlay source={NICONO_LOGO} />; }

// ————————————————————————————————————————————————————————————————
// Handwritten drink notes — the preview of a kitchen counter card (the mocktails
// list, the 0.0 beer list). A contained image, so rotate / tilt / resize /
// brightness in the editor all apply (sit it onto the angled card).
// ————————————————————————————————————————————————————————————————
const NOTE_MOCKTAILS = require("../../../assets/scenes/note_mocktails.png");
const NOTE_00_BEER = require("../../../assets/scenes/note_0_0_beer.png");
export function NoteMocktailsInlay() { return <LogoInlay source={NOTE_MOCKTAILS} />; }
export function Note00BeerInlay() { return <LogoInlay source={NOTE_00_BEER} />; }

// ————————————————————————————————————————————————————————————————
// Preferences — the PDA on the profile desk, showing your REAL notification
// settings (the same notification_preferences the Preferences & Permissions
// screen reads). A light paper screen, each row ticked to its live state, so
// the device mirrors your actual choices. Transparent to taps — the hotspot it
// sits in opens the full Preferences screen. Defaults to on when nothing's
// saved yet, matching the settings screen.
// ————————————————————————————————————————————————————————————————
const PREF_ROWS: { key: string; label: string }[] = [
  { key: "daily_checkin", label: "Daily check-in" },
  { key: "morning_reflection", label: "Morning reflection" },
  { key: "drinking_reminders", label: "Pause reminders" },
  { key: "session_nudges", label: "Slow-down nudges" },
  { key: "milestone_alerts", label: "Milestones" },
  { key: "community_updates", label: "Community" },
];
export function PreferencesInlay() {
  const userId = useAuthStore((s) => s.user?.id);
  const { data: prefs } = useQuery({
    queryKey: ["notification-prefs", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", userId!)
        .maybeSingle();
      return data;
    },
    enabled: !!userId,
  });
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: "#efe7d4", overflow: "hidden", paddingHorizontal: "9%", paddingVertical: "8%" }]}>
      <Text style={{ fontFamily: "PatrickHand", fontSize: 10, color: "#4a3f6a", letterSpacing: 0.5, marginBottom: "5%" }} numberOfLines={1}>
        PREFERENCES
      </Text>
      <View style={{ gap: 3 }}>
        {PREF_ROWS.map((row) => {
          const on = (prefs as any)?.[row.key] ?? true;
          return (
            <View key={row.key} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 4 }}>
              <Text numberOfLines={1} style={{ fontFamily: "PatrickHand", fontSize: 9.5, color: "#2b2435", flex: 1 }}>{row.label}</Text>
              <View style={{ width: 9, height: 9, borderRadius: 2, borderWidth: 1.1, borderColor: "#6b5f8f", backgroundColor: on ? "#7b5fc0" : "transparent", alignItems: "center", justifyContent: "center" }}>
                {on ? <Text style={{ color: "#fff", fontSize: 7, lineHeight: 7.5 }}>✓</Text> : null}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ————————————————————————————————————————————————————————————————
// Registry — keyed by a hotspot's `inlay` id (set in hubScene.ts).
// ————————————————————————————————————————————————————————————————
// ————————————————————————————————————————————————————————————————
// Messages — your REAL message threads (same useConnections the Messenger page
// uses), so the computer screen mirrors the actual inbox: each row is a real
// contact + their last message, with a purple dot for unread. Empty state
// echoes the real screen. Transparent; tapping opens the full Messenger.
// ————————————————————————————————————————————————————————————————
export function MessagesInlay() {
  const { data } = useConnections();
  const threads = ((data ?? []) as any[]).slice(0, 3);
  return (
    <View style={[StyleSheet.absoluteFill, { overflow: "hidden", paddingHorizontal: "8%", paddingVertical: "8%", justifyContent: "center", gap: 6 }]}>
      {threads.length === 0 ? (
        <Text style={{ fontFamily: MONO, fontSize: 8.5, color: "rgba(214,201,240,0.5)", textAlign: "center", lineHeight: 12 }}>
          {"// no contacts yet\nconnect with a mentor, or\nmessage from a community post"}
        </Text>
      ) : (
        threads.map((c, i) => (
          <View key={c.requestId ?? i} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <View style={{ width: 13, height: 13, borderRadius: 7, backgroundColor: (c.unreadCount ?? 0) > 0 ? "rgba(177,151,228,0.9)" : "rgba(198,222,208,0.7)" }} />
            <View style={{ flex: 1 }}>
              <Text numberOfLines={1} style={{ fontFamily: "PatrickHand", fontSize: 11, color: "rgba(244,244,238,0.92)" }}>{c.otherUsername ?? "Member"}</Text>
              <Text numberOfLines={1} style={{ fontFamily: "PatrickHand", fontSize: 10, color: "rgba(198,222,208,0.62)" }}>{c.lastMessage?.content ?? "say hello"}</Text>
            </View>
          </View>
        ))
      )}
    </View>
  );
}

// ————————————————————————————————————————————————————————————————
// Bookshelf — the hand-drawn book covers lined up like spines on the study
// shelf, so one ring on the shelf reads as a shelf full of real books (no tacky
// ring-per-book). Tapping opens the whole library.
// ————————————————————————————————————————————————————————————————
const SHELF_BOOKS: ToolkitCategory[] = ["in-the-moment", "understand", "triggers", "stress", "relationships", "sleep"];
export function BookshelfInlay() {
  return (
    <View style={[StyleSheet.absoluteFill, { overflow: "hidden", flexDirection: "row", alignItems: "flex-end", justifyContent: "center", paddingHorizontal: "3%", paddingVertical: "4%", gap: 2 }]}>
      {SHELF_BOOKS.map((cat, i) => {
        const art = BOOKS[cat];
        if (!art?.cover) return null;
        return (
          <View
            key={cat}
            style={{
              flex: 1,
              height: `${86 - (i % 3) * 5}%`,
              maxWidth: "17%",
              borderRadius: 1,
              overflow: "hidden",
              backgroundColor: "#2a2233",
              transform: [{ rotate: `${(i % 2 ? 1 : -1) * 1.2}deg` }],
            }}
          >
            <Image source={art.cover} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
          </View>
        );
      })}
    </View>
  );
}

// ————————————————————————————————————————————————————————————————
// Real arcade games — each actual HTML game (the ones you coded) running in a
// WebView on its cabinet screen, so the preview IS the real game, not a demo.
// Pointer-transparent via the wrapper, so a tap still opens the full game.
// Heavier than the drawn demos — use ONE per screen, sized to the screen.
// ————————————————————————————————————————————————————————————————
function GameWebInlay({ slug }: { slug: string }) {
  const g = ARCADE_GAMES[slug];
  if (!g) return null;
  return (
    <View style={[StyleSheet.absoluteFill, { overflow: "hidden", backgroundColor: "#1f1430" }]}>
      <WebView
        originWhitelist={["*"]}
        source={{ html: g.html }}
        style={{ flex: 1, backgroundColor: "#1f1430" }}
        pointerEvents="none"
        scrollEnabled={false}
        scalesPageToFit
        javaScriptEnabled
        domStorageEnabled
        setSupportMultipleWindows={false}
        androidLayerType="hardware"
      />
    </View>
  );
}
export function SkullGroveInlay() { return <GameWebInlay slug="skull-grove" />; }
export function GrowthShieldInlay() { return <GameWebInlay slug="growth-shield" />; }
export function SkullPathInlay() { return <GameWebInlay slug="skull-path" />; }
export function SkullHavenInlay() { return <GameWebInlay slug="skull-haven" />; }

export const INLAYS: Record<string, React.ComponentType> = {
  arcade: ArcadeInlay, // Odd One Out — also the café arcade cabinet
  arcade_memory: MemoryInlay,
  arcade_pattern: PatternInlay,
  arcade_colour: ColourInlay,
  arcade_word: WordInlay,
  community: CommunityInlay, // video thumbnails
  community_board: CommunityBoardInlay, // written posts, chalked on the board
  // The real games (your HTML), live on their cabinet screens.
  skull_grove: SkullGroveInlay,
  growth_shield: GrowthShieldInlay,
  skull_path: SkullPathInlay,
  skull_haven: SkullHavenInlay,
  messages: MessagesInlay, // recent threads, on the computer / mailslot
  bookshelf: BookshelfInlay, // the book covers lined up on the study shelf
  moments: MomentsBoardInlay, // your photos, pinned to the Me-room corkboard
  cannano_logo: CannanoLogoInlay, // sibling-app crests on the reception doors
  cocano_logo: CocanoLogoInlay,
  medano_logo: MedanoLogoInlay,
  nicono_logo: NiconoLogoInlay,
  note_mocktails: NoteMocktailsInlay, // the mocktails card on the kitchen counter
  note_0_0_beer: Note00BeerInlay, // the 0.0 beer card on the kitchen counter
  prefs_pda: PreferencesInlay, // live notification settings on the profile PDA
};

/** The live previews offered in the editor's inlay picker (label + inlay key).
 *  The sibling-app crests are left out — they're not cabin objects. */
export const INLAY_OPTIONS: { id: string; label: string }[] = [
  { id: "skull_grove", label: "Game — Skull Grove (live)" },
  { id: "growth_shield", label: "Game — Growth Shield (live)" },
  { id: "skull_path", label: "Game — Skull Path (live)" },
  { id: "skull_haven", label: "Game — Skull Haven (live)" },
  { id: "community", label: "Community — video thumbnails" },
  { id: "community_board", label: "Community — written posts" },
  { id: "messages", label: "Messages — recent threads" },
  { id: "bookshelf", label: "Bookshelf — the books" },
  { id: "note_mocktails", label: "Note — Mocktails card" },
  { id: "note_0_0_beer", label: "Note — 0.0 Beer card" },
  { id: "moments", label: "Your moments — photos" },
  { id: "prefs_pda", label: "Preferences — PDA (live)" },
];
