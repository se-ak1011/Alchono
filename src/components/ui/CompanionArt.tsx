import React from 'react';
import {
  Image,
  Pressable,
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
  onPress?: () => void;
};

export function CompanionArt({
  source,
  width,
  height,
  cropHeight,
  opacity = 0.8,
  containerStyle,
  imageStyle,
  onPress,
}: CompanionArtProps) {
  const Container = onPress ? Pressable : View;

  return (
    <Container
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={onPress ? 'Ask the companion for help' : undefined}
      onPress={onPress}
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
    </Container>
  );
}
