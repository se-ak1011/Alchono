import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { SafeArea } from '@/components/ui/SafeArea';
import { ZoneGlow } from '@/components/ui/ZoneGlow';
import { DrinkingSession } from '@/components/home/DrinkingSession';
import { headingShadow } from '@/styles';

/**
 * "Tonight" — the home for day-to-day drink awareness that used to live on the
 * old dashboard: the alcohol-free marker, starting/managing a session, and the
 * live harm-reduction nudges. Split out so the companion Home can stay calm,
 * while none of this is lost. Reached from Home (a live chip when a session is
 * on) and from Me.
 */
export default function TrackScreen() {
  const router = useRouter();
  return (
    <SafeArea>
      <ZoneGlow zone="urge" intensity={0.8} />
      <View className="px-6 pt-4 pb-2 flex-row items-center gap-3">
        <Pressable onPress={() => router.back()} hitSlop={12} className="p-1 -ml-1 active:opacity-60">
          <Feather name="chevron-left" size={26} color="#B2ACC0" />
        </Pressable>
        <View>
          <Text className="text-text-primary text-4xl tracking-tight" style={headingShadow}>
            Tonight
          </Text>
          <Text className="text-text-muted text-sm mt-0.5">
            Awareness, not judgement.
          </Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <DrinkingSession />
      </ScrollView>
    </SafeArea>
  );
}
