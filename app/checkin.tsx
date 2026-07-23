import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { SafeArea } from '@/components/ui/SafeArea';
import { MoodCheckin } from '@/components/home/MoodCheckin';
import { useCompanion } from '@/hooks/useCompanion';
import { CompanionArt } from '@/components/ui/CompanionArt';
import { headingShadow } from '@/styles';

/**
 * The daily check-in, as its own calm moment rather than a dashboard card.
 * Reached from a gentle prompt on Home (only shown when today isn't logged);
 * closes itself the moment it's saved.
 */
export default function CheckinScreen() {
  const router = useRouter();
  const { pose } = useCompanion();

  return (
    <SafeArea>
      <View className="px-6 pt-4 pb-1 flex-row items-center justify-between">
        <Text className="text-text-primary" style={{ ...headingShadow, fontSize: 34 }}>
          How are you?
        </Text>
        <Pressable onPress={() => router.back()} hitSlop={12} className="p-1 active:opacity-60">
          <Feather name="x" size={24} color="#817B91" />
        </Pressable>
      </View>
      <Text className="text-text-muted text-sm px-6 mb-2">
        A few seconds. Pick as many as fit.
      </Text>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="items-center py-3">
          <CompanionArt source={pose('bust')} width={132} height={156} cropHeight={130} />
        </View>
        <MoodCheckin onDone={() => router.back()} />
      </ScrollView>
    </SafeArea>
  );
}
