import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, Platform, type LayoutChangeEvent } from "react-native";
import Svg, { Circle, Line as SvgLine } from "react-native-svg";
import { useCommunityFeed } from "@/hooks/useCommunity";
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

const SERIF = Platform.select({ ios: "Georgia", default: "serif" }) as string;
const MONO = Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }) as string;
const PAPER = "#e7e1d2";
const INK = "#2b2620";

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
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: "#0a0812", alignItems: "center", justifyContent: "center", overflow: "hidden" }]}>
      {/* screen glow */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(164,137,222,0.10)" }]} />
      <View style={{ width: "78%", aspectRatio: 1, flexDirection: "row", flexWrap: "wrap" }}>
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
// Community — the two latest posts, chalked onto the board.
// ————————————————————————————————————————————————————————————————
export function CommunityInlay() {
  const { data: feed } = useCommunityFeed();
  const posts = (feed?.pages?.[0] ?? []).slice(0, 2) as any[];
  return (
    <View style={[StyleSheet.absoluteFill, { paddingHorizontal: "8%", paddingVertical: "6%", justifyContent: "center", overflow: "hidden" }]}>
      <Text style={{ fontFamily: MONO, fontSize: 7, letterSpacing: 1.5, color: "rgba(214,201,240,0.55)", marginBottom: 3 }}>
        ON THE BOARD
      </Text>
      {posts.length === 0 ? (
        <Text style={{ fontFamily: "PatrickHand", fontSize: 11, color: "rgba(236,233,241,0.8)" }}>be the first to post…</Text>
      ) : (
        posts.map((p, i) => (
          <Text
            key={p.id ?? i}
            numberOfLines={2}
            style={{ fontFamily: "PatrickHand", fontSize: 11, lineHeight: 13, color: "rgba(240,236,247,0.92)", marginTop: i ? 5 : 0 }}
          >
            {"“"}
            {p.content}
            {"”"}
          </Text>
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
    <View onLayout={onLayout} style={[StyleSheet.absoluteFill, { backgroundColor: "#141019", overflow: "hidden" }]}>
      {k > 0 ? (
        <Svg width={layout.w} height={layout.h}>
          {latent.map((s, i) => (
            <Circle key={`u${i}`} cx={cx + s.x * k} cy={cy + s.y * k} r={Math.max(0.4, s.r * k * 0.6)} fill="#9A93AD" fillOpacity={0.22 + s.twinkle * 0.3} />
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
// Papers — a masthead clipping sat on the rack. One per paper.
// ————————————————————————————————————————————————————————————————
function PaperInlay({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: PAPER, paddingHorizontal: "7%", paddingVertical: "6%", justifyContent: "center", overflow: "hidden" }]}>
      <Text numberOfLines={1} style={{ fontFamily: MONO, fontSize: 6.5, letterSpacing: 1.5, color: "rgba(0,0,0,0.5)" }}>
        {eyebrow}
      </Text>
      <Text numberOfLines={2} adjustsFontSizeToFit style={{ fontFamily: SERIF, fontWeight: "700", fontSize: 15, lineHeight: 17, color: INK, marginTop: 2 }}>
        {title}
      </Text>
      <View style={{ height: 1, backgroundColor: "rgba(0,0,0,0.25)", marginTop: 4 }} />
    </View>
  );
}

export const GazetteInlay = () => <PaperInlay eyebrow="GOOD NEWS" title="The Good News Gazette" />;
export const FunnyInlay = () => <PaperInlay eyebrow="HAVE A GIGGLE" title="The Funny Pages" />;
export const LettersInlay = () => <PaperInlay eyebrow="LETTERS" title="The Letters Page" />;

// ————————————————————————————————————————————————————————————————
// Registry — keyed by a hotspot's `inlay` id (set in hubScene.ts).
// ————————————————————————————————————————————————————————————————
export const INLAYS: Record<string, React.ComponentType> = {
  arcade: ArcadeInlay,
  community: CommunityInlay,
  sky: SkyInlay,
  "paper-gazette": GazetteInlay,
  "paper-funny": FunnyInlay,
  "paper-letters": LettersInlay,
};
