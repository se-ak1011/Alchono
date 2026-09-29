import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { SafeArea } from '@/components/ui/SafeArea';
import { ZoneGlow } from '@/components/ui/ZoneGlow';
import { RoomBackdrop } from '@/components/ui/RoomBackdrop';
import { DrinkingSession } from '@/components/home/DrinkingSession';
import { headingShadow } from '@/styles';
import { ScreenHeader } from '@/components/ui/ScreenHeader';

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
      {/* A room at dusk — a windowsill where you check in with the evening,
          calm and low-lit rather than a form on a black void. */}
      <RoomBackdrop warmth="#8AB2AE" floor="#26222E" lampTop={140} horizon={0.6} intensity={0.8} />
      <ScreenHeader title="Tonight" subtitle="Awareness, not judgement." size={34} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <DrinkingSession />
      </ScrollView>
    </SafeArea>
  );
}
