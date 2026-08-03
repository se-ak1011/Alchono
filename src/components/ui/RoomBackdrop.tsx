import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Defs, RadialGradient, LinearGradient, Stop, Rect } from 'react-native-svg';

/**
 * The difference between "an app with a nice theme" and a *place*.
 *
 * Three layers of real light (via SVG gradients, so nothing has a hard edge):
 *  1. a soft lamp glow blooming from one spot,
 *  2. a vignette that darkens the edges so the screen feels *enclosed* — walls
 *     around you, not a cut-out floating on an infinite plane,
 *  3. a floor rising to meet the wall at the horizon.
 *
 * Drop it in just after ZoneGlow. One knob (`warmth`) tunes the mood, so a cosy
 * tea-room and a cool night-room are the same component.
 */

function rgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function RoomBackdrop({
  /** The lamp colour — warm amber for a tea-room, cool for a night-room. */
  warmth = '#E8C9A0',
  /** The floor tint — a grounded warm-charcoal by default. */
  floor = '#2C2432',
  /** Fraction of height where the back wall meets the floor (0–1). */
  horizon = 0.6,
  /** Overall strength of the lamp + floor. */
  intensity = 1,
  /** How dark the enclosing edges get (0 = none, ~0.6 = cosy and close). */
  vignette = 0.5,
  /** Where the lamp sits, top-down, in points (kept for call-site compatibility). */
  lampTop,
}: {
  warmth?: string;
  floor?: string;
  horizon?: number;
  intensity?: number;
  vignette?: number;
  lampTop?: number;
}) {
  const { width, height } = useWindowDimensions();
  const lampCy = lampTop != null ? Math.min(0.85, lampTop / height) : 0.34;
  const floorY = height * horizon;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width={width} height={height}>
        <Defs>
          {/* The lamp: a soft warm bloom, brightest where it's placed. */}
          <RadialGradient id="rb-lamp" cx="50%" cy={`${lampCy * 100}%`} rx="70%" ry="55%">
            <Stop offset="0" stopColor={warmth} stopOpacity={0.24 * intensity} />
            <Stop offset="0.45" stopColor={warmth} stopOpacity={0.09 * intensity} />
            <Stop offset="1" stopColor={warmth} stopOpacity={0} />
          </RadialGradient>
          {/* The walls: darkness gathering at the edges, holding you in. */}
          <RadialGradient id="rb-vign" cx="50%" cy="40%" rx="75%" ry="70%">
            <Stop offset="0.5" stopColor="#100D16" stopOpacity={0} />
            <Stop offset="1" stopColor="#100D16" stopOpacity={vignette} />
          </RadialGradient>
          {/* The floor: rising to meet the wall. */}
          <LinearGradient id="rb-floor" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={floor} stopOpacity={0} />
            <Stop offset="0.5" stopColor={floor} stopOpacity={0.5 * intensity} />
            <Stop offset="1" stopColor={floor} stopOpacity={0.85 * intensity} />
          </LinearGradient>
        </Defs>

        <Rect x="0" y="0" width={width} height={height} fill="url(#rb-lamp)" />
        <Rect x="0" y={floorY} width={width} height={height - floorY} fill="url(#rb-floor)" />
        {/* A whisper of lamp-light catching the horizon line. */}
        <Rect x="0" y={floorY} width={width} height={1} fill={rgba(warmth, 0.14 * intensity)} />
        <Rect x="0" y="0" width={width} height={height} fill="url(#rb-vign)" />
      </Svg>
    </View>
  );
}

/**
 * A soft ellipse of shadow to sit a figure ON the floor instead of floating it
 * above one. Place it just behind (lower z than) the companion, centred under
 * where their feet would land.
 */
export function ContactShadow({
  width = 180,
  height = 30,
  opacity = 0.32,
  style,
}: {
  width?: number;
  height?: number;
  opacity?: number;
  style?: any;
}) {
  return (
    <View
      pointerEvents="none"
      style={[
        {
          width,
          height,
          borderRadius: width / 2,
          backgroundColor: `rgba(10, 8, 14, ${opacity})`,
        },
        style,
      ]}
    />
  );
}
