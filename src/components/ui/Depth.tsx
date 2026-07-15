import React from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';

/**
 * The premium theme's depth layer (see docs/theme.md). Sits behind screen
 * content to kill the flat look — a barely-there vertical tonal lift plus a
 * microscopic vignette, so the interface feels layered without looking
 * textured. Static and non-interactive.
 *
 * Monochromatic film-grain noise (1–2%) is a planned refinement; it needs a
 * tiled PNG asset to render reliably on iOS, so it's intentionally omitted
 * here rather than faked with an unreliable runtime filter.
 */
export const Depth = React.memo(function Depth() {
  const { width, height } = useWindowDimensions();
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {/* Vertical lift: a hair warmer/lighter violet at the top, settling into
          the base near-black by the bottom. Barely perceptible on purpose. */}
      <LinearGradient
        colors={['#1A1820', '#15141A', '#15141A'] as const}
        locations={[0, 0.5, 1] as const}
        style={StyleSheet.absoluteFill}
      />
      {/* Vignette: invisible through the centre, a soft darkening at the very
          edges to draw the eye inward. */}
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="vignette" cx="50%" cy="38%" r="78%">
            <Stop offset="0%" stopColor="#000000" stopOpacity={0} />
            <Stop offset="68%" stopColor="#000000" stopOpacity={0} />
            <Stop offset="100%" stopColor="#000000" stopOpacity={0.38} />
          </RadialGradient>
        </Defs>
        <Rect x={0} y={0} width={width} height={height} fill="url(#vignette)" />
      </Svg>
    </View>
  );
});
