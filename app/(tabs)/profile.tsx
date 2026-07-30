import React from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { SafeArea } from '@/components/ui/SafeArea';
import { ZoneGlow } from '@/components/ui/ZoneGlow';
import { HubCard } from '@/components/ui/HubCard';
import { useAfDays } from '@/hooks/useVictories';
import { headingShadow, celebrationGlow } from '@/styles';

/**
 * Me — the inward heart: your progress, your journey, your tracking. Account
 * details live on the separate Profile page; app settings live in Settings.
 */
export default function MeScreen() {
  const router = useRouter();
  const { data: dates = [] } = useAfDays();
  const days = dates.length;

  return (
    <SafeArea>
      <ZoneGlow zone="me" intensity={1.4} />
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

        {/* Your sky, front and centre — the progress that was hidden before */}
        <Pressable
          onPress={() => router.push('/constellation' as any)}
          className="mx-6 mt-2 mb-8 rounded-3xl bg-surface-2 border border-white/10 px-6 py-6 active:opacity-80"
        >
          <Text className="text-text-primary" style={{ ...celebrationGlow, fontSize: 44, lineHeight: 48 }}>
            {days}
          </Text>
          <View className="flex-row items-center justify-between mt-1">
            <Text className="text-text-secondary text-base">
              {days === 1 ? 'alcohol-free day' : 'alcohol-free days'}
            </Text>
            <View className="flex-row items-center gap-1.5">
              <Text className="text-text-muted text-sm">Your sky</Text>
              <Feather name="chevron-right" size={15} color="#817B91" />
            </View>
          </View>
        </Pressable>

        <Text className="text-text-muted text-xs font-medium tracking-widest uppercase mb-2.5 ml-7">
          Your journey
        </Text>
        <View className="mx-6">
          <HubCard
            elevated
            title="Tonight"
            subtitle="Mark an alcohol-free day, or track a session with gentle nudges. Awareness, not judgement."
            onPress={() => router.push('/session/track' as any)}
          />
          <HubCard
            title="Progress"
            subtitle="Your patterns, moods and the tough moments you got through."
            onPress={() => router.push('/(tabs)/insights' as any)}
          />
          <HubCard
            title="Looking forward to"
            subtitle="The things you're staying the course for."
            onPress={() => router.push('/goals' as any)}
          />
          <HubCard
            title="Your moments"
            subtitle="Your photos and videos — a private scrapbook, plus anything you've shared."
            onPress={() => router.push('/moments' as any)}
          />
        </View>

        <Text className="text-text-muted text-xs font-medium tracking-widest uppercase mb-2.5 mt-6 ml-7">
          You
        </Text>
        <View className="mx-6">
          <HubCard
            title="Profile"
            subtitle="Your details, the people around you, and what makes you you."
            onPress={() => router.push('/account' as any)}
          />
        </View>
      </ScrollView>
    </SafeArea>
  );
}
