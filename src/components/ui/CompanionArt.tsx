import React from 'react';
import {
  Image,
  type ImageSourcePropType,
  type ImageStyle,
  type StyleProp,
  View,
  type ViewStyle,
} from 'react-native';

type CompanionArtProps = {
  source: ImageSourcePropType;
  width: number;
  height: number;
  cropHeight?: number;
  opacity?: number;
  containerStyle?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
};

export function CompanionArt({
  source,
  width,
  height,
  cropHeight,
  opacity = 0.82,
  containerStyle,
  imageStyle,
}: CompanionArtProps) {
  return (
    <View
      style={[
        {
          width,
          height: cropHeight ?? height,
          alignItems: 'center',
          overflow: cropHeight ? 'hidden' : 'visible',
        },
        containerStyle,
      ]}
    >
      <Image
        source={source}
        accessible={false}
        resizeMode="contain"
        style={[{ width, height, opacity }, imageStyle]}
      />
    </View>
  );
}
