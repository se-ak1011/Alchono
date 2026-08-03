import React from 'react';
import { ScrollView, View, Text, Pressable, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeArea } from '@/components/ui/SafeArea';
import { ZoneGlow } from '@/components/ui/ZoneGlow';
import { RoomBackdrop, ContactShadow } from '@/components/ui/RoomBackdrop';
import { ZoneChip } from '@/components/ui/ZoneChip';
import { CompanionArt } from '@/components/ui/CompanionArt';
import { MiniSky } from '@/components/constellation/MiniSky';
import { useAfDays } from '@/hooks/useVictories';
import { useCompanion } from '@/hooks/useCompanion';
import { useAuthStore } from '@/store/authStore';
import { headingShadow } from '@/styles';

/**
 * Me — the inward heart: your progress, your journey, your tracking. It opens
 * with your sky, not a number: progress you feel rather than a score you're
 * measured by. The count lives on the Progress page for whoever wants it.
 * Account details live on the separate Profile page; settings live in Settings.
 */
export default function MeScreen() {
  const router = useRouter();
  const { pose } = useCompanion();
  const { data: dates = [] } = useAfDays();
  const userId = useAuthStore((s) => s.user?.id) ?? 'anon';
  const { width } = useWindowDimensions();
  const skyW = width - 48; // mx-6 either side
  const skyH = 190;

  return (
    <SafeArea>
      <ZoneGlow zone="me" intensity={1.4} />
      {/* Your room, at night — a cool moonlit lamp and a floor to stand on, so
          this feels like where you *are*, not a menu about you. */}
      <RoomBackdrop warmth="#9B86C4" floor="#241F2E" lampTop={150} horizon={0.62} intensity={0.85} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="px-6 pt-5 pb-2 flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <Pressable onPress={() => router.back()} hitSlop={12} className="p-1 -ml-1 active:opacity-60">
              <Feather name="chevron-left" size={26} color="#B2ACC0" />
            </Pressable>
            <Text className="text-text-primary text-4xl tracking-tight" style={headingShadow}>
              Me
            </Text>
          </View>
          <View className="flex-row items-center gap-1">
            <Pressable onPress={() => router.push('/account' as any)} hitSlop={12} className="p-2 active:opacity-60">
              <Feather name="user" size={21} color="#B2ACC0" />
            </Pressable>
            <Pressable onPress={() => router.push('/settings')} hitSlop={12} className="p-2 -mr-2 active:opacity-60">
              <Feather name="settings" size={21} color="#B2ACC0" />
            </Pressable>
          </View>
        </View>

        {/* Your companion, here on your own page too — a mate beside your
            journey, not just on the way to somewhere. */}
        <View className="items-center mt-1 mb-3" pointerEvents="none">
          <CompanionArt source={pose('bust')} width={128} height={152} cropHeight={128} />
          <ContactShadow width={116} height={20} opacity={0.28} style={{ marginTop: -6 }} />
        </View>

        {/* Your sky, front and centre — progress felt as light, not counted.
            No number here: this is the room you *are* in, not a scoreboard. */}
        <Pressable
          onPress={() => router.push('/constellation' as any)}
          className="mx-6 mt-2 mb-8 rounded-3xl overflow-hidden border border-white/10 active:opacity-90"
          style={{ height: skyH, backgroundColor: '#201D28' }}
        >
          <View style={{ position: 'absolute', left: 0, top: 0 }}>
            <MiniSky dates={dates} userSeed={userId} width={skyW} height={skyH} />
          </View>
          <LinearGradient
            colors={['transparent', 'rgba(24,21,32,0.55)', 'rgba(24,21,32,0.94)']}
            style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 120 }}
          />
          <View style={{ position: 'absolute', left: 20, right: 20, bottom: 18 }}>
            <View className="flex-row items-end justify-between">
              <View className="flex-1 pr-3">
                <Text className="text-text-primary text-2xl font-semibold tracking-tight" style={headingShadow}>
                  Your sky
                </Text>
                <Text className="text-text-secondary text-sm mt-1 leading-snug">
                  {dates.length === 0
                    ? 'A whole sky, waiting to light up'
                    : 'Every alcohol-free night, a star that stays lit'}
                </Text>
              </View>
              <View className="flex-row items-center gap-1 mb-0.5">
                <Text className="text-text-muted text-sm">Open</Text>
                <Feather name="chevron-right" size={15} color="#817B91" />
              </View>
            </View>
          </View>
        </Pressable>

        <Text className="text-text-muted text-xs font-medium tracking-widest uppercase mb-2.5 ml-7">
          Your journey
        </Text>
        <View className="mx-6">
          <ZoneChip
            icon="moon"
            accent="#8AB2AE"
            title="Tonight"
            subtitle="Mark an alcohol-free day, or track a session with gentle nudges."
            onPress={() => router.push('/session/track' as any)}
          />
          <ZoneChip
            icon="trending-up"
            accent="#B9A4EC"
            title="Progress"
            subtitle="Your patterns, moods and the tough moments you got through."
            onPress={() => router.push('/(tabs)/insights' as any)}
          />
          <ZoneChip
            icon="sunrise"
            accent="#E6C56A"
            title="Looking forward to"
            subtitle="The things you're staying the course for."
            onPress={() => router.push('/goals' as any)}
          />
          <ZoneChip
            icon="image"
            accent="#CE969E"
            title="Your moments"
            subtitle="Your photos and videos — a private scrapbook, plus anything you've shared."
            onPress={() => router.push('/moments' as any)}
          />
        </View>

        <Text className="text-text-muted text-xs font-medium tracking-widest uppercase mb-2.5 mt-6 ml-7">
          You
        </Text>
        <View className="mx-6">
          <ZoneChip
            icon="user"
            accent="#C6BFB0"
            title="Profile"
            subtitle="Your details, the people around you, and what makes you you."
            onPress={() => router.push('/account' as any)}
          />
        </View>
      </ScrollView>
    </SafeArea>
  );
}
