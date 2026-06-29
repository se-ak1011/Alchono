import React from 'react';
import { View, Text } from 'react-native';

type Variant = 'default' | 'accent' | 'success' | 'warning';

interface BadgeProps {
  label: string;
  variant?: Variant;
}

const variantClasses: Record<Variant, { container: string; text: string }> = {
  default: { container: 'bg-surface-2 border border-white/10', text: 'text-text-secondary' },
  accent: { container: 'bg-accent/20 border border-accent/30', text: 'text-accent' },
  success: { container: 'bg-white/10 border border-white/20', text: 'text-text-primary' },
  warning: { container: 'bg-orange-900/30 border border-orange-700/30', text: 'text-orange-400' },
};

export function Badge({ label, variant = 'default' }: BadgeProps) {
  const { container, text } = variantClasses[variant];
  return (
    <View className={`px-2.5 py-1 rounded-full ${container}`}>
      <Text className={`text-xs font-medium ${text}`}>{label}</Text>
    </View>
  );
}
