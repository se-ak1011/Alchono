import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Line as SvgLine } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import type { Sky } from '@/lib/constellation';

interface Props {
  sky: Sky;
  onSelectStar: (date: string) => void;
}

const STAR_COLOR = '#F4F1ED';
const LINE_COLOR = '#A79FB2';
const HIT_RADIUS = 20; // canvas units — how close a tap must land to a star

export function ConstellationSky({ sky, onSelectStar }: Props) {
  const [layout, setLayout] = useState({ w: 0, h: 0 });
  const initialised = useRef(false);

  const canvasSize = Math.max(240, (sky.radius + 60) * 2);
  const half = canvasSize / 2;

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const savedTx = useSharedValue(0);
  const savedTy = useSharedValue(0);

  // Fit the whole sky on first layout, then let the user roam.
  useEffect(() => {
    if (initialised.current || layout.w === 0) return;
    const fit = Math.min(layout.w, layout.h) * 0.42 / (sky.radius + 30);
    const s = Math.max(0.4, Math.min(2.4, isFinite(fit) ? fit : 1.5));
    scale.value = withTiming(s, { duration: 600 });
    savedScale.value = s;
    initialised.current = true;
  }, [layout, sky.radius]);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setLayout({ w: width, h: height });
  };

  const selectAt = (screenX: number, screenY: number, s: number, panX: number, panY: number) => {
    const cx = (screenX - layout.w / 2 - panX) / s;
    const cy = (screenY - layout.h / 2 - panY) / s;
    let best: string | null = null;
    let bestD = HIT_RADIUS;
    for (const star of sky.stars) {
      const d = Math.hypot(star.x - cx, star.y - cy);
      if (d < bestD) {
        bestD = d;
        best = star.date;
      }
    }
    if (best) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onSelectStar(best);
    }
  };

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = Math.max(0.3, Math.min(6, savedScale.value * e.scale));
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  const pan = Gesture.Pan()
    .minDistance(6)
    .onUpdate((e) => {
      tx.value = savedTx.value + e.translationX;
      ty.value = savedTy.value + e.translationY;
    })
    .onEnd(() => {
      savedTx.value = tx.value;
      savedTy.value = ty.value;
    });

  const tap = Gesture.Tap()
    .maxDistance(10)
    .onEnd((e) => {
      runOnJS(selectAt)(e.x, e.y, scale.value, tx.value, ty.value);
    });

  const gesture = Gesture.Simultaneous(pinch, pan, tap);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { scale: scale.value },
    ],
  }));

  const lastDate = sky.stars.length ? sky.stars[sky.stars.length - 1].date : null;

  return (
    <View onLayout={onLayout} style={{ flex: 1, overflow: 'hidden', backgroundColor: '#060509' }}>
      <GestureDetector gesture={gesture}>
        <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
          <Svg
            width={canvasSize}
            height={canvasSize}
            viewBox={`${-half} ${-half} ${canvasSize} ${canvasSize}`}
            style={{
              position: 'absolute',
              left: (layout.w - canvasSize) / 2,
              top: (layout.h - canvasSize) / 2,
            }}
          >
            {sky.lines.map((l, i) => (
              <SvgLine
                key={`l${i}`}
                x1={l.x1}
                y1={l.y1}
                x2={l.x2}
                y2={l.y2}
                stroke={LINE_COLOR}
                strokeOpacity={l.opacity}
                strokeWidth={0.6}
              />
            ))}
            {sky.stars.map((s) => {
              const isLatest = s.date === lastDate;
              return (
                <React.Fragment key={s.date}>
                  {isLatest && (
                    <Circle cx={s.x} cy={s.y} r={s.r + 5} fill={LINE_COLOR} fillOpacity={0.16} />
                  )}
                  <Circle
                    cx={s.x}
                    cy={s.y}
                    r={isLatest ? s.r + 0.8 : s.r}
                    fill={STAR_COLOR}
                    fillOpacity={isLatest ? 1 : s.opacity}
                  />
                </React.Fragment>
              );
            })}
          </Svg>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
