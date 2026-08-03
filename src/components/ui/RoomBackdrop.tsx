import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

/**
 * The difference between "an app with a nice theme" and a *place*.
 *
 * ZoneGlow gives a screen its colour temperature; RoomBackdrop gives it a
 * ROOM — a floor to stand on, a back wall catching lamp-light, and a soft pool
 * of warmth where a lamp would be. Drop it in just after ZoneGlow, and a
 * companion who used to float on a flat void suddenly *inhabits* somewhere.
 *
 * Purely decorative and non-interactive. One knob (`warmth`) tunes the whole
 * mood, so a cosy tea-room and a cool night-room are the same component.
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
  /** Overall strength of the whole effect. */
  intensity = 1,
  /** Where the lamp pool sits, top-down, in points. */
  lampTop = 150,
}: {
  warmth?: string;
  floor?: string;
  horizon?: number;
  intensity?: number;
  lampTop?: number;
}) {
  const rings = [
    { size: 460, alpha: 0.05 },
    { size: 320, alpha: 0.07 },
    { size: 200, alpha: 0.1 },
  ];

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {/* Lamp pool — layered soft rings fake a radial glow the way the room
          would actually be lit: brightest at the middle, feathering out. */}
      <View
        style={{
          position: 'absolute',
          top: lampTop,
          left: 0,
          right: 0,
          alignItems: 'center',
        }}
      >
        {rings.map((r) => (
          <View
            key={r.size}
            style={{
              position: 'absolute',
              width: r.size,
              height: r.size,
              borderRadius: r.size / 2,
              marginTop: -r.size / 2,
              backgroundColor: rgba(warmth, r.alpha * intensity),
            }}
          />
        ))}
      </View>

      {/* The floor: a grounded plane rising to meet the wall at the horizon. */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          top: `${horizon * 100}%`,
        }}
      >
        <LinearGradient
          colors={[
            rgba(floor, 0),
            rgba(floor, 0.45 * intensity),
            rgba(floor, 0.82 * intensity),
          ]}
          locations={[0, 0.5, 1]}
          style={{ flex: 1 }}
        />
      </View>

      {/* A whisper of lamp-light catching the horizon where wall meets floor. */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: `${horizon * 100}%`,
          height: 1,
          backgroundColor: rgba(warmth, 0.12 * intensity),
        }}
      />
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
