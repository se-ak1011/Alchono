import React from 'react';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

interface MaskIconProps {
  size?: number;
  color?: string;
  gradient?: boolean;
}

export function MaskIcon({ size = 32, color = '#B77A33', gradient = false }: MaskIconProps) {
  const gradientId = 'maskGradient';

  return (
    <Svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      {gradient && (
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="#D4973F" />
            <Stop offset="1" stopColor="#8A5A24" />
          </LinearGradient>
        </Defs>
      )}
      {/* Left half — full mask face */}
      <Path
        d="M20 6 C12 6 6 11 6 18 L6 22 C6 26 8 29 12 30 L20 31 L20 6 Z"
        fill={gradient ? `url(#${gradientId})` : color}
        opacity={0.9}
      />
      {/* Right half — open/revealed face */}
      <Path
        d="M20 6 C28 6 34 11 34 18 L34 22 C34 26 32 29 28 30 L20 31 L20 6 Z"
        fill={gradient ? `url(#${gradientId})` : color}
        opacity={0.35}
      />
      {/* Left eye cutout */}
      <Circle cx="14" cy="17" r="2.5" fill="#151718" opacity={0.9} />
      {/* Right eye (faded, representing "real" face) */}
      <Circle cx="26" cy="17" r="2" fill={gradient ? `url(#${gradientId})` : color} opacity={0.3} />
      {/* Dividing line */}
      <Path
        d="M20 6 L20 31"
        stroke="#151718"
        strokeWidth="0.75"
        strokeDasharray="2 2"
        opacity={0.5}
      />
    </Svg>
  );
}

export function MaskIconSmall({ size = 24, color = '#B77A33' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3 C8 3 5 6 5 10 L5 13 C5 15.5 6.5 17 9 17.5 L12 18 L12 3 Z"
        fill={color}
        opacity={0.9}
      />
      <Path
        d="M12 3 C16 3 19 6 19 10 L19 13 C19 15.5 17.5 17 15 17.5 L12 18 L12 3 Z"
        fill={color}
        opacity={0.3}
      />
      <Circle cx="8.5" cy="10" r="1.5" fill="#151718" opacity={0.9} />
      <Circle cx="15.5" cy="10" r="1.2" fill={color} opacity={0.3} />
    </Svg>
  );
}
