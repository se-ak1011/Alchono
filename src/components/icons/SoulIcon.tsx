import React from 'react';
import Svg, { G, Circle, Rect, Defs, LinearGradient, Stop } from 'react-native-svg';

interface SoulIconProps {
  size?: number;
  gradient?: boolean;
}

/**
 * "The Passenger" — a grounded self (solid) with a departing soul (ghosted, drifting up).
 * Represents the moment alcohol detaches you from your own agency.
 */
export function SoulIcon({ size = 32, gradient = false }: SoulIconProps) {
  const id = 'soulGrad';

  return (
    <Svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      {gradient && (
        <Defs>
          <LinearGradient id={id} x1="8" y1="4" x2="32" y2="38" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="#D4973F" />
            <Stop offset="1" stopColor="#8A5A24" />
          </LinearGradient>
        </Defs>
      )}

      {/* Departing soul — same shape, drifted upward, ghosted */}
      <G opacity={0.22} translateX={3} translateY={-5}>
        {/* Soul head */}
        <Circle cx="17" cy="13" r="4.5" fill={gradient ? `url(#${id})` : '#B77A33'} />
        {/* Soul body */}
        <Rect x="11.5" y="18.5" width="11" height="13" rx="5.5"
          fill={gradient ? `url(#${id})` : '#B77A33'} />
      </G>

      {/* Grounded self — solid, anchored */}
      {/* Head */}
      <Circle cx="17" cy="14" r="4.5" fill={gradient ? `url(#${id})` : '#B77A33'} />
      {/* Body */}
      <Rect x="11.5" y="19.5" width="11" height="13" rx="5.5"
        fill={gradient ? `url(#${id})` : '#B77A33'} />
    </Svg>
  );
}
