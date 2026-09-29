import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { headingShadow } from '@/styles';

/**
 * The one screen header for every destination page, so they all speak the same
 * language as the hub instead of looking like a different admin app. A back
 * chevron + a Patrick Hand (chalk) title + optional subtitle, with an optional
 * slot on the right. Swap a page's hand-rolled header for this and it instantly
 * reads as the world. The warm backdrop is still each page's own ZoneGlow.
 */
export function ScreenHeader({
  title,
  subtitle,
  onBack,
  right,
  size = 30,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
  size?: number;
}) {
  const router = useRouter();
  return (
    <View className="flex-row items-start gap-3 px-6 pt-4 pb-2">
      <Pressable
        onPress={onBack ?? (() => router.back())}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Back"
        className="p-1 -ml-1 mt-1 active:opacity-60"
      >
        <Feather name="chevron-left" size={26} color="#B2ACC0" />
      </Pressable>
      <View className="flex-1">
        <Text
          style={[{ fontFamily: 'PatrickHand', fontSize: size, lineHeight: size + 4, color: '#ECE9F1' }, headingShadow]}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text className="text-text-secondary text-base leading-relaxed mt-0.5">{subtitle}</Text>
        ) : null}
      </View>
      {right ? <View className="mt-1">{right}</View> : null}
    </View>
  );
}
