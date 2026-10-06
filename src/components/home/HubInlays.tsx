import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, Image, StyleSheet, Platform, type LayoutChangeEvent } from "react-native";
import Svg, { Circle, Line as SvgLine, Defs, LinearGradient, RadialGradient, Stop, Rect } from "react-native-svg";
import { useCommunityMoments, useMyMoments } from "@/hooks/useMoments";
import { useCommunityFeed } from "@/hooks/useCommunity";
import { useAfDays } from "@/hooks/useVictories";
import { useAuthStore } from "@/store/authStore";
import { buildSky } from "@/lib/constellation";
import { ConstellationSky } from "@/components/constellation/ConstellationSky";

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
// Sky — the REAL My Sky, rendered from the same ConstellationSky component the
// full room uses, so the window preview IS your actual sky (one source of
// truth, no separate re-draw that could drift from it). The inlay wrapper is
// pointerEvents="none", so the sky's own gestures never fire here — tapping the
// object opens the full room. Dim/brighten it per scene with the hotspot's
// opacity (the editor's "Brightness" control).
// ————————————————————————————————————————————————————————————————
export function SkyInlay() {
  const { data: dates = [] } = useAfDays();
  const userId = useAuthStore((s) => s.user?.id) ?? "anon";
  const sky = useMemo(() => buildSky(dates, userId), [dates, userId]);
  return (
    <View style={[StyleSheet.absoluteFill, { overflow: "hidden" }]}>
      <ConstellationSky sky={sky} onSelectStar={() => {}} />
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
// The Zine — a little cover pinned to the corkboard, like a paper on a board.
// Static (a pinned paper, not a live screen): a masthead, a line, faux columns.
// ————————————————————————————————————————————————————————————————
export function ZineInlay() {
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: "#efe6d2", overflow: "hidden", paddingHorizontal: "9%", paddingVertical: "8%" }]}>
      <Text style={{ fontFamily: "PatrickHand", fontSize: 13, color: "#2b2320", textAlign: "center", letterSpacing: 1 }} numberOfLines={1}>
        THE ZINE
      </Text>
      <View style={{ height: 1, backgroundColor: "rgba(43,35,32,0.4)", marginVertical: "5%" }} />
      <Text style={{ fontFamily: "PatrickHand", fontSize: 9, color: "#2b2320", lineHeight: 11 }} numberOfLines={2}>
        Stories · a puzzle · a recipe
      </Text>
      <View style={{ gap: 3, marginTop: "7%" }}>
        {[1, 0.82, 0.93, 0.68].map((w, i) => (
          <View key={i} style={{ height: 2.5, width: `${w * 100}%`, backgroundColor: "rgba(43,35,32,0.22)", borderRadius: 1 }} />
        ))}
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
// Registry — keyed by a hotspot's `inlay` id (set in hubScene.ts).
// ————————————————————————————————————————————————————————————————
export const INLAYS: Record<string, React.ComponentType> = {
  arcade: ArcadeInlay, // Odd One Out — also the café arcade cabinet
  arcade_memory: MemoryInlay,
  arcade_pattern: PatternInlay,
  arcade_colour: ColourInlay,
  arcade_word: WordInlay,
  community: CommunityInlay, // video thumbnails
  community_board: CommunityBoardInlay, // written posts, chalked on the board
  moments: MomentsBoardInlay, // your photos, pinned to the Me-room corkboard
  sky: SkyInlay,
  zine: ZineInlay, // a zine cover pinned to the café-right corkboard
  cannano_logo: CannanoLogoInlay, // sibling-app crests on the reception doors
  cocano_logo: CocanoLogoInlay,
  medano_logo: MedanoLogoInlay,
  nicono_logo: NiconoLogoInlay,
};
