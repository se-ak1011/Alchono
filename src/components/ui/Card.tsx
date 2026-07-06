import React from 'react';
import { View, Pressable, type ViewProps } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

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

  const baseClass = `bg-surface rounded-2xl p-5 border border-white/5 ${className}`;

  // A whisper of light on the top edge + a grounded shadow — cards lift off
  // the background instead of sitting flat on it.
  const depthStyle = {
    borderTopColor: 'rgba(255,255,255,0.16)',
    shadowColor: '#000000',
    shadowOpacity: 0.42,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 5,
  } as const;

  if (onPress) {
    return (
      <AnimatedPressable
        style={[animatedStyle, depthStyle]}
        onPressIn={() => {
          scale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 15, stiffness: 300 });
        }}
        onPress={onPress}
        className={baseClass}
      >
        {children}
      </AnimatedPressable>
    );
  }

  return (
    <View className={baseClass} style={depthStyle} {...rest}>
      {children}
    </View>
  );
}
