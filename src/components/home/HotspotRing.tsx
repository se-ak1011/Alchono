import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Easing } from "react-native";
import Svg, { Path } from "react-native-svg";

/**
 * A hand-drawn "pencil ring" that circles a tappable object — the replacement
 * for the old light-bloom glows, which read as modern UI stuck on top of a dark
 * room. A ring is a stroke, not a light, so it never looks like it's emitting
 * anything; it just sits around the thing like someone circled it in pencil.
 *
 * Two visibility tiers drive the "learn it, then let it fade" arc:
 *   - "loud"  → the first time you're ever in a room: clear, unmissable, so you
 *               learn where everything is.
 *   - "faint" → every visit after: a whisper, a reminder, not a signpost.
 * (Off entirely is handled by the caller not rendering a ring at all — the
 * "I'm home, I know my house" setting.)
 *
 * Each ring breathes on its OWN slow loop with a seeded duration + phase, so a
 * room full of them never throbs in unison — it feels alive, not animated. With
 * reduce-motion on, the ring holds still at a middle brightness.
 */

// Graphite — it's a pencil line, so it's (near) black. A whisper of pale lift
// sits under it so the line still reads on near-black cabin wood instead of
// vanishing into it; the dark stroke on top keeps it reading as pencil, not glow.
const INK = "#121016";
const LIFT = "#E9E3F3";

// Deterministic 0..1 from a string seed, so a ring's wobble + phase are stable
// across renders (no flicker) but differ per hotspot.
function hashSeed(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

// A slightly rough, hand-drawn ellipse ring in a 0..100 viewBox. preserveAspect
// "none" lets it stretch to the hotspot's box, so it ovals around a wide object
// and circles a square one. The small per-point jitter is the pencil wobble.
function roughRingPath(seed: number) {
  const cx = 50;
  const cy = 50;
  const rx = 41;
  const ry = 41;
  const N = 22;
  const rnd = (i: number) => {
    const v = Math.sin(seed * 371.1 + i * 53.7) * 43758.5453;
    return v - Math.floor(v);
  };
  let d = "";
  for (let i = 0; i <= N; i++) {
    const t = (i / N) * Math.PI * 2 + seed * Math.PI * 2;
    const j = 1 + (rnd(i) - 0.5) * 0.1;
    const x = cx + Math.cos(t) * rx * j;
    const y = cy + Math.sin(t) * ry * j;
    d += (i === 0 ? "M" : "L") + x.toFixed(1) + "," + y.toFixed(1) + " ";
  }
  return d + "Z";
}

export function HotspotRing({
  tier,
  seed,
  animate = true,
  strength = 1,
}: {
  tier: "loud" | "faint";
  seed: string;
  animate?: boolean;
  /** Global pencil-pressure multiplier (Settings). 1 = default. */
  strength?: number;
}) {
  const p = useRef(new Animated.Value(0.5)).current;
  const r = useMemo(() => hashSeed(seed), [seed]);
  const d = useMemo(() => roughRingPath(r), [r]);

  useEffect(() => {
    if (!animate) {
      p.setValue(0.5);
      return;
    }
    const dur = 2600 + Math.round(r * 1600); // 2.6–4.2s, per-ring
    const delay = Math.round(r * 1400); // staggered start so none sync up
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(p, { toValue: 1, duration: dur, delay, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(p, { toValue: 0, duration: dur, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [p, animate, r]);

  const loud = tier === "loud";
  // Opacity, scaled by the global strength knob and clamped so it never over-burns.
  const base = loud ? [0.42, 0.62] : [0.28, 0.46];
  const opacity = p.interpolate({ inputRange: [0, 1], outputRange: base.map((v) => Math.min(0.95, v * strength)) });
  const scale = p.interpolate({ inputRange: [0, 1], outputRange: loud ? [0.98, 1.05] : [1.0, 1.035] });

  return (
    <Animated.View
      pointerEvents="none"
      style={{ position: "absolute", left: "-10%", top: "-10%", width: "120%", height: "120%", opacity, transform: [{ scale }] }}
    >
      {/* vectorEffect keeps the stroke a CONSTANT screen width regardless of how
          the box stretches the viewBox — so a tall door-ring no longer blooms
          into thick vertical blobs while the thin sides vanish. */}
      <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* Pale lift underneath so a dark graphite line still reads on dark wood. */}
        <Path d={d} stroke={LIFT} strokeOpacity={0.16} strokeWidth={loud ? 3.6 : 2.6} strokeLinecap="round" strokeLinejoin="round" fill="none" vectorEffect="non-scaling-stroke" />
        {/* The pencil line itself. */}
        <Path d={d} stroke={INK} strokeWidth={loud ? 2.1 : 1.5} strokeLinecap="round" strokeLinejoin="round" fill="none" vectorEffect="non-scaling-stroke" />
      </Svg>
    </Animated.View>
  );
}
