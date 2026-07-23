import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { ZoneGlow } from '@/components/ui/ZoneGlow';
import { useRouter } from 'expo-router';
import { SafeArea } from '@/components/ui/SafeArea';
import { AiCoachChat } from '@/components/support/AiCoachChat';
import { headingShadow } from '@/styles';

export default function CoachScreen() {
  const router = useRouter();
  return (
    <SafeArea bottom={false}>
      <ZoneGlow zone="support" intensity={0.55} />
      <View className="flex-row items-center gap-4 px-6 pt-4 pb-3">
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={{ color: '#817B91', fontSize: 18 }}>←</Text>
        </Pressable>
        <Text
          className="text-text-primary text-2xl font-semibold tracking-tight"
          style={headingShadow}
        >
          AI Coach
        </Text>
      </View>
      <View className="flex-1">
        <AiCoachChat />
      </View>
    </SafeArea>
  );
}
