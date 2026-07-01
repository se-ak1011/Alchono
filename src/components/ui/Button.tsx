import React from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  View,
  type PressableProps,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  title: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-accent active:bg-accent-dark',
  secondary: 'bg-surface-2 active:bg-surface border border-white/10',
  ghost: 'bg-transparent active:bg-white/5',
  danger: 'bg-danger active:bg-danger-light',
  accent: 'bg-white/8 border border-white/15 active:bg-white/12',
};

const textClasses: Record<Variant, string> = {
  primary: 'text-[#0E0F10] font-semibold',
  secondary: 'text-text-primary font-medium',
  ghost: 'text-text-secondary font-medium',
  danger: 'text-white font-semibold',
  accent: 'text-text-secondary font-semibold',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-5 py-3 rounded-xl',
  md: 'px-6 py-4 rounded-xl',
  lg: 'px-7 py-5 rounded-2xl',
};

const textSizeClasses: Record<Size, string> = {
  sm: 'text-base',
  md: 'text-lg',
  lg: 'text-xl',
};

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  className = '',
  fullWidth = false,
  onPress,
  ...rest
}: ButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const isDisabled = disabled || loading;

  return (
    <Animated.View
      style={[animatedStyle, fullWidth ? { width: '100%' } : { alignSelf: 'flex-start' }]}
    >
      <Pressable
        onPressIn={() => {
          scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 15, stiffness: 300 });
        }}
        onPress={async (e) => {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress?.(e);
        }}
        disabled={isDisabled}
        className={`flex-row items-center justify-center ${sizeClasses[size]} ${variantClasses[variant]} ${isDisabled ? 'opacity-50' : ''} ${className}`}
        {...rest}
      >
        {loading ? (
          <ActivityIndicator
            size="small"
            color={variant === 'primary' ? '#0E0F10' : variant === 'ghost' ? '#9CA3AF' : '#F0F2F4'}
          />
        ) : (
          <>
            {icon && <View className="mr-2">{icon}</View>}
            <Text
              className={`${textClasses[variant]} ${textSizeClasses[size]} tracking-tight`}
            >
              {title}
            </Text>
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}
