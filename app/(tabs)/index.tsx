import React from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeArea } from '@/components/ui/SafeArea';
import { Card } from '@/components/ui/Card';
import { GreetingHeader } from '@/components/home/GreetingHeader';
import { MoodCheckin } from '@/components/home/MoodCheckin';
import { DrinkingSession } from '@/components/home/DrinkingSession';
import { HomeFeed } from '@/components/home/HomeFeed';
import { AnchorsCard } from '@/components/home/AnchorsCard';
import { PauseModal } from '@/components/home/PauseModal';
import { useYesterdaySession } from '@/hooks/useJournal';
import { useAppStore } from '@/store/appStore';

function MorningReflectionPrompt() {
  const { data: yesterdaySession } = useYesterdaySession();
  const { morningReflectionDismissed, dismissMorningReflection } = useAppStore();
  const router = useRouter();

  const isAfterMidnight = new Date().getHours() < 12;

  if (!yesterdaySession || morningReflectionDismissed || !isAfterMidnight) {
    return null;
  }

  return (
    <Animated.View entering={FadeIn.duration(400)} className="mx-6 mt-4">
      <Card className="border border-white/10">
        <Text className="text-text-muted text-sm font-semibold tracking-widest uppercase mb-2">
          Yesterday
        </Text>
        <Text className="text-text-primary text-lg font-semibold mb-1">
          How did it go?
        </Text>
        <Text className="text-text-secondary text-base mb-5 leading-relaxed">
          Worth a look.
        </Text>
        <View className="flex-row gap-2">
          <Pressable
            onPress={dismissMorningReflection}
            className="flex-1 items-center py-3 rounded-xl bg-surface border border-white/8 active:border-white/20"
          >
            <Text className="text-text-muted text-base font-medium">Not now</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push('/session/morning-reflection')}
            className="flex-1 items-center py-3 rounded-xl bg-accent active:bg-accent-dark"
          >
            <Text className="text-white text-base font-semibold">Reflect</Text>
          </Pressable>
        </View>
      </Card>
    </Animated.View>
  );
}

function DailyGameCard() {
  const router = useRouter();
  return (
    <Animated.View entering={FadeIn.duration(400)} className="mx-6 mt-4 flex-row gap-3">
      <Pressable
        onPress={async () => {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push('/session/games');
        }}
        className="flex-1 px-5 py-4 bg-surface rounded-2xl border border-white/5 active:border-white/15"
      >
        <Text className="text-text-secondary text-base font-medium">Games</Text>
        <Text className="text-text-muted text-sm mt-0.5">Give your mind something else.</Text>
      </Pressable>
      <Pressable
        onPress={async () => {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push('/session/good-feed');
        }}
        className="flex-1 px-5 py-4 bg-surface rounded-2xl border border-white/5 active:border-white/15"
      >
        <Text className="text-text-secondary text-base font-medium">Something good</Text>
        <Text className="text-text-muted text-sm mt-0.5">Today's feel-good picks.</Text>
      </Pressable>
    </Animated.View>
  );
}

export default function HomeScreen() {
  return (
    <SafeArea>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 48 }}
      >
        <GreetingHeader />
        <AnchorsCard />
        <DailyGameCard />
        <MoodCheckin />
        <MorningReflectionPrompt />
        <DrinkingSession />
        <HomeFeed />
      </ScrollView>
      <PauseModal />
    </SafeArea>
  );
}
