import React, { useEffect, useRef, useState } from "react";
import { Animated, View, StyleSheet, AccessibilityInfo, type ImageStyle } from "react-native";
import type { AmbientEffect } from "@/data/ambientLife";

// How a single effect plays: a slow cross-dissolve through its frames. Each
// frame already bakes its own faint→peak→gone alpha, so stepping through them
// reads as the thing quietly blooming and vanishing.
const PLAY_MS = 2800;
// When the first effect appears after you arrive (soon, so it's seen) and the
// random gap between the ones after (rare + irregular, so it never forms a
// pattern you can learn). Tunable — lengthen GAP_* for an even quieter forest.
const FIRST_MIN = 6000;
const FIRST_MAX = 12000;
const GAP_MIN = 25000;
const GAP_MAX = 95000;

const rand = (lo: number, hi: number) => lo + Math.random() * (hi - lo);

/**
 * The quiet-bioluminescence layer. Sits above a scene's night art and, on a
 * random timer, plays ONE registered effect at a time (a vein, the embers, a
 * water-glimpse…), then waits a fresh random gap. Only runs while `active`
 * (night, not editing) and never when the OS reduce-motion setting is on.
 */
export function AmbientLife({
  effects,
  active,
  imageStyle,
}: {
  effects: AmbientEffect[];
  active: boolean;
  imageStyle: ImageStyle;
}) {
  const [current, setCurrent] = useState<AmbientEffect | null>(null);
  const p = useRef(new Animated.Value(0)).current;
  const [reduceMotion, setReduceMotion] = useState(false);

  // Respect the phone's reduce-motion accessibility setting — some people open
  // this in a hard moment and won't want anything moving.
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => mounted && setReduceMotion(!!v))
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", (v) =>
      setReduceMotion(!!v),
    );
    return () => {
      mounted = false;
      // @ts-ignore older RN returns a function, newer a subscription
      sub?.remove ? sub.remove() : typeof sub === "function" && sub();
    };
  }, []);

  useEffect(() => {
    if (!active || reduceMotion || effects.length === 0) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let lastId: string | null = null;

    const playNext = () => {
      if (cancelled) return;
      // Pick a random effect, avoiding an immediate repeat.
      let pool = effects.filter((e) => e.id !== lastId);
      if (pool.length === 0) pool = effects;
      const eff = pool[Math.floor(Math.random() * pool.length)];
      lastId = eff.id;
      setCurrent(eff);
      p.setValue(0);
      Animated.timing(p, {
        toValue: Math.max(1, eff.frames.length - 1),
        duration: PLAY_MS,
        useNativeDriver: true,
      }).start(() => {
        if (cancelled) return;
        setCurrent(null);
        schedule(false);
      });
    };

    const schedule = (first: boolean) => {
      const delay = first ? rand(FIRST_MIN, FIRST_MAX) : rand(GAP_MIN, GAP_MAX);
      timer = setTimeout(playNext, delay);
    };

    schedule(true);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [active, reduceMotion, effects, p]);

  if (!current) return null;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {current.frames.map((src, i) => (
        <Animated.Image
          key={current.id + "-" + i}
          source={src}
          resizeMode="cover"
          style={[
            imageStyle,
            {
              opacity: p.interpolate({
                inputRange: [i - 1, i, i + 1],
                outputRange: [0, 1, 0],
                extrapolate: "clamp",
              }),
            },
          ]}
        />
      ))}
    </View>
  );
}
