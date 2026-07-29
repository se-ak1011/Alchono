import React from 'react';
import { View, Text } from 'react-native';

/**
 * Draws a moment's caption OVER the media (top/center/bottom) when the author
 * chose an overlay position. Pure display overlay — the video/photo file is
 * never re-encoded. Returns nothing for the default 'below' behaviour.
 */
export function CaptionOverlay({
  caption,
  position,
}: {
  caption?: string | null;
  position?: string | null;
}) {
  if (!caption || !position || position === 'below') return null;

  const vertical =
    position === 'top'
      ? { top: 16 }
      : position === 'center'
        ? { top: 0, bottom: 0, justifyContent: 'center' as const }
        : { bottom: 16 };

  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', left: 0, right: 0, alignItems: 'center', paddingHorizontal: 18, ...vertical }}
    >
      <Text
        style={{
          color: '#fff',
          fontSize: 20,
          fontWeight: '700',
          textAlign: 'center',
          textShadowColor: 'rgba(0,0,0,0.85)',
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 6,
          backgroundColor: 'rgba(0,0,0,0.32)',
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 10,
          overflow: 'hidden',
        }}
      >
        {caption}
      </Text>
    </View>
  );
}
