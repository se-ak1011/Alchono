import React, { useState } from 'react';
import { Image, type ImageSourcePropType, View } from 'react-native';

const SIZE_PX = {
  small: 96,
  medium: 140,
  large: 184,
} as const;

const ALIGNMENT = {
  left: 'flex-start',
  center: 'center',
  right: 'flex-end',
} as const;

interface CompanionImageProps {
  source?: ImageSourcePropType | null;
  size: keyof typeof SIZE_PX;
  alignment: keyof typeof ALIGNMENT;
  opacity?: number;
  maxHeight?: number;
}

export function CompanionImage({
  source,
  size,
  alignment,
  opacity = 0.72,
  maxHeight,
}: CompanionImageProps) {
  const [failed, setFailed] = useState(false);

  if (!source || failed) return null;

  const imageSize = SIZE_PX[size];
  const height = Math.min(imageSize, maxHeight ?? imageSize);

  return (
    <View
      pointerEvents="none"
      style={{
        width: '100%',
        alignItems: ALIGNMENT[alignment],
        overflow: 'hidden',
      }}
    >
      <Image
        source={source}
        resizeMode="contain"
        onError={() => setFailed(true)}
        style={{
          width: imageSize,
          height,
          maxHeight: maxHeight ?? imageSize,
          opacity,
        }}
      />
    </View>
  );
}
