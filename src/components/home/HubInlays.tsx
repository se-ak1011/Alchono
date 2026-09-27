import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, Image, StyleSheet, Platform, type LayoutChangeEvent } from "react-native";
import Svg, { Circle, Line as SvgLine } from "react-native-svg";
import { useCommunityMoments } from "@/hooks/useMoments";
import { useAfDays } from "@/hooks/useVictories";
import { useAuthStore } from "@/store/authStore";
import { buildSky } from "@/lib/constellation";

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
// Sky — the real constellation, drawn small on the board/window. No gestures:
// it's a picture of your sky, and tapping the object opens the full room.
// ————————————————————————————————————————————————————————————————
export function SkyInlay() {
  const [layout, setLayout] = useState({ w: 0, h: 0 });
  const { data: dates = [] } = useAfDays();
  const userId = useAuthStore((s) => s.user?.id) ?? "anon";
  const sky = useMemo(() => buildSky(dates, userId), [dates, userId]);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setLayout({ w: width, h: height });
  };

  const size = Math.min(layout.w, layout.h);
  const span = (sky.radius + 20) * 2;
  const k = size > 0 ? size / span : 0;
  const cx = layout.w / 2;
  const cy = layout.h / 2;
  const lit = sky.stars.filter((s) => s.lit);
  const latent = sky.stars.filter((s) => !s.lit);

  return (
    <View onLayout={onLayout} style={[StyleSheet.absoluteFill, { backgroundColor: "#191428", overflow: "hidden" }]}>
      {/* A faint sky-glow so the panel — and its tilt — reads even when few stars
          are lit (an all-black rectangle hides the depth entirely). */}
      <View pointerEvents="none" style={{ position: "absolute", left: "10%", top: "8%", right: "10%", bottom: "8%", borderRadius: 999, backgroundColor: "rgba(126,104,178,0.16)" }} />
      {k > 0 ? (
        <Svg width={layout.w} height={layout.h}>
          {latent.map((s, i) => (
            <Circle key={`u${i}`} cx={cx + s.x * k} cy={cy + s.y * k} r={Math.max(0.5, s.r * k * 0.7)} fill="#B3ABC6" fillOpacity={0.34 + s.twinkle * 0.34} />
          ))}
          {sky.lines.map((l, i) => (
            <SvgLine key={`l${i}`} x1={cx + l.x1 * k} y1={cy + l.y1 * k} x2={cx + l.x2 * k} y2={cy + l.y2 * k} stroke="#A489DE" strokeOpacity={l.opacity} strokeWidth={0.5} />
          ))}
          {lit.map((s, i) => (
            <Circle key={`s${i}`} cx={cx + s.x * k} cy={cy + s.y * k} r={Math.max(0.7, (s.r + 0.4) * k)} fill="#FBF4E9" fillOpacity={0.78 + s.twinkle * 0.22} />
          ))}
        </Svg>
      ) : null}
    </View>
  );
}

// ————————————————————————————————————————————————————————————————
// Registry — keyed by a hotspot's `inlay` id (set in hubScene.ts).
// ————————————————————————————————————————————————————————————————
export const INLAYS: Record<string, React.ComponentType> = {
  arcade: ArcadeInlay,
  community: CommunityInlay,
  sky: SkyInlay,
};
