import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';

/**
 * A described navigation card — says what the feature is *for*, not just its
 * name, so destinations stay discoverable rather than lost in a list.
 */
export function HubCard({
  title,
  subtitle,
  onPress,
  elevated = false,
}: {
  title: string;
  subtitle?: string;
  onPress: () => void;
  elevated?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center gap-4 rounded-2xl px-5 py-4 mb-3 border ${
        elevated ? 'bg-surface-2 border-white/10' : 'bg-surface border-white/5'
      } active:opacity-80`}
    >
      <View className="flex-1">
        <Text className="text-text-primary text-base font-semibold">{title}</Text>
        {subtitle ? (
          <Text className="text-text-secondary text-sm mt-1 leading-relaxed">{subtitle}</Text>
        ) : null}
      </View>
      <Feather name="chevron-right" size={18} color="#817B91" />
    </Pressable>
  );
}
