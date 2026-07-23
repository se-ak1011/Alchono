import React from 'react';
import { View, Text, type TextProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ZONES, type ZoneKey } from '@/lib/zones';

/**
 * The zone colour system, made visible without touching a screen's layout: a
 * soft wash of the place's accent at the top, fading into the plum-charcoal
 * base. It gives each destination its own quiet "temperature" — Reading feels
 * heather, Writing feels dusty rose — while staying cohesive and understated.
 *
 * Deliberately subtle and non-interactive. All of the colour lives here, so
 * tuning the whole system is a one-file change. Drop it as the first child
 * inside a screen's SafeArea; content renders naturally on top.
 */
function rgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function ZoneGlow({
  zone,
  height = 400,
  intensity = 1,
}: {
  zone: ZoneKey;
  /** How far down the wash reaches. */
  height?: number;
  /** Multiplier on the wash strength (1 = default). */
  intensity?: number;
}) {
  const accent = ZONES[zone].accent;
  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, height }}
    >
      <LinearGradient
        colors={[
          rgba(accent, 0.32 * intensity),
          rgba(accent, 0.13 * intensity),
          'rgba(32, 29, 40, 0)', // plum base (#201D28) at zero alpha → clean fade
        ]}
        locations={[0, 0.45, 1]}
        style={{ flex: 1 }}
      />
    </View>
  );
}

/**
 * A section eyebrow tinted in the zone's accent — the small uppercase label
 * that gives a place its identity (as in the mock). Same quiet weight as the
 * app's other eyebrows; only the colour changes.
 */
export function ZoneLabel({
  zone,
  children,
  style,
  ...rest
}: TextProps & { zone: ZoneKey; children: React.ReactNode }) {
  return (
    <Text
      {...rest}
      style={[
        {
          color: ZONES[zone].accent,
          fontSize: 12,
          fontFamily: 'Inter_600SemiBold',
          letterSpacing: 2,
          textTransform: 'uppercase',
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
