import React from 'react';
import Svg, { G, Circle, Rect } from 'react-native-svg';

const STEEL = '#C4C9D0';

interface SoulIconProps {
  size?: number;
  color?: string;
}

export function SoulIcon({ size = 32, color = STEEL }: SoulIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      {/* Departing soul — drifted upward, ghosted */}
      <G opacity={0.2} translateX={3} translateY={-5}>
        <Circle cx="17" cy="13" r="4.5" fill={color} />
        <Rect x="11.5" y="18.5" width="11" height="13" rx="5.5" fill={color} />
      </G>
      {/* Grounded self — solid */}
      <Circle cx="17" cy="14" r="4.5" fill={color} />
      <Rect x="11.5" y="19.5" width="11" height="13" rx="5.5" fill={color} />
    </Svg>
  );
}

export function SoulIconSmall({ size = 24, color = STEEL }: SoulIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Departing soul */}
      <G opacity={0.2} translateX={2} translateY={-3}>
        <Circle cx="10" cy="8" r="2.8" fill={color} />
        <Rect x="7" y="11.5" width="6.5" height="8" rx="3.25" fill={color} />
      </G>
      {/* Grounded self */}
      <Circle cx="10" cy="8.5" r="2.8" fill={color} />
      <Rect x="7" y="12" width="6.5" height="8" rx="3.25" fill={color} />
    </Svg>
  );
}
