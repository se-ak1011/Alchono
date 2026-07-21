import React, { useRef } from "react";
import {
  Image,
  Pressable,
  type ImageSourcePropType,
  type ImageStyle,
  type StyleProp,
  View,
  Animated,
  type ViewStyle,
} from "react-native";

type CompanionArtProps = {
  source: ImageSourcePropType;
  width: number;
  height: number;
  cropHeight?: number;
  opacity?: number;
  containerStyle?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  onPress?: () => void;
  onLongPress?: () => void;
};

export function CompanionArt({
  source,
  width,
  height,
  cropHeight,
  opacity = 1,
  containerStyle,
  imageStyle,
  onPress,
  onLongPress,
}: CompanionArtProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const suppressNextPress = useRef(false);
  const Container = onPress || onLongPress ? Pressable : View;

  const bounce = () => {
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 0.97,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 5,
        tension: 90,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePress = () => {
    if (suppressNextPress.current) {
      suppressNextPress.current = false;
      return;
    }
    bounce();
    onPress?.();
  };

  const handleLongPress = () => {
    suppressNextPress.current = true;
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 0.98,
        duration: 90,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 140,
        useNativeDriver: true,
      }),
    ]).start();
    onLongPress?.();
  };

  return (
    <Container
      accessibilityRole={onPress || onLongPress ? "button" : undefined}
      accessibilityLabel={onPress || onLongPress ? "Companion" : undefined}
      onPress={handlePress}
      onLongPress={handleLongPress}
      delayLongPress={600}
      style={[
        {
          width,
          height: cropHeight ?? height,
          alignItems: "center",
          overflow: cropHeight ? "hidden" : "visible",
          transform: [{ scale }],
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
