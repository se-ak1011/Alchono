import React from 'react';
import { View, Pressable, type ViewProps } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface CardProps extends Omit<ViewProps, 'style'> {
  children: React.ReactNode;
  className?: string;
  onPress?: () => void;
  elevated?: boolean;
}

export function Card({ children, className = '', onPress, elevated = false, ...rest }: CardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const baseClass = `bg-surface rounded-2xl p-5 ${elevated ? 'border border-white/5' : ''} ${className}`;

  if (onPress) {
    return (
      <AnimatedPressable
        style={animatedStyle}
        onPressIn={() => {
          scale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 15, stiffness: 300 });
        }}
        onPress={async () => {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        className={baseClass}
      >
        {children}
      </AnimatedPressable>
    );
  }

  return (
    <View className={baseClass} {...rest}>
      {children}
    </View>
  );
}
