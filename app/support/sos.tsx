import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { AiCoachChat } from '@/components/support/AiCoachChat';

export default function SosScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-1 bg-bg"
      style={{ paddingTop: insets.top + 8 }}
    >
      <Animated.View
        entering={FadeInDown.duration(400)}
        className="flex-row items-center px-6 mb-4"
      >
        <Pressable
          onPress={() => router.back()}
          className="w-8 h-8 rounded-full bg-surface items-center justify-center mr-3"
        >
          <Text className="text-text-secondary">✕</Text>
        </Pressable>
        <View>
          <Text className="text-text-primary text-lg font-semibold">
            I'm here with you.
          </Text>
          <Text className="text-text-muted text-xs mt-0.5">
            AI support · Private · Always available
          </Text>
        </View>
      </Animated.View>

      <AiCoachChat sessionType="sos" />
    </View>
  );
}
