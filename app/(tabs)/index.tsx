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
import { useReflectionDoneToday } from '@/hooks/useJournal';
import { useChoicesDoneToday } from '@/hooks/useChoices';
import { useMonthlyRecap } from '@/hooks/useMonthlyRecap';
import { useSmartReminder } from '@/hooks/useSmartReminder';
import { useWidgetSync } from '@/hooks/useWidgetSync';
import { useAppStore } from '@/store/appStore';
import { useAuthStore } from '@/store/authStore';

function MorningReflectionPrompt() {
  const { data: reflectedToday } = useReflectionDoneToday();
  const { morningReflectionDismissed, dismissMorningReflection } = useAppStore();
  const router = useRouter();

  const isAfterMidnight = new Date().getHours() < 12;

  // Every morning, for every kind of day — not only after a drinking session.
  // The good days and the got-through-it days deserve reflecting on too.
  // Hides once reflected today (DB-backed), soft-dismissed, or past midday.
  if (reflectedToday || morningReflectionDismissed || !isAfterMidnight) {
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
          Rough, quiet, or genuinely good — it all counts.
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

function MonthlyRecapCard() {
  const { recap, dismiss } = useMonthlyRecap();
  if (!recap) return null;

  const lines: string[] = [];
  if (recap.afDays > 0)
    lines.push(`${recap.afDays} alcohol-free day${recap.afDays === 1 ? '' : 's'}`);
  if (recap.urgesBeaten > 0)
    lines.push(`${recap.urgesBeaten} tough moment${recap.urgesBeaten === 1 ? '' : 's'} you got through`);
  if (recap.checkins > 0) lines.push(`${recap.checkins} check-ins`);

  return (
    <Animated.View entering={FadeIn.duration(400)} className="mx-6 mt-4">
      <Card className="border border-white/10">
        <View className="flex-row items-start justify-between mb-1">
          <Text className="text-text-muted text-sm font-semibold tracking-widest uppercase">
            Your {recap.monthLabel}
          </Text>
          <Pressable onPress={dismiss} hitSlop={12}>
            <Text className="text-text-muted text-base">✕</Text>
          </Pressable>
        </View>
        <Text className="text-text-primary text-xl font-semibold mb-2">
          {lines.join(' · ')}.
        </Text>
        <Text className="text-text-secondary text-base leading-relaxed">
          That's a month of showing up. Carry it into this one.
        </Text>
      </Card>
    </Animated.View>
  );
}

function SwapsCard() {
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const interested = (profile?.preferences as any)?.interestedInAlternatives === true;
  // Only for people who opted in — 0.0 drinks can be a trigger for others.
  if (!interested) return null;
  return (
    <Animated.View entering={FadeIn.duration(400)} className="mx-6 mt-3">
      <Pressable
        onPress={async () => {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push('/swaps');
        }}
        className="flex-row items-center justify-between px-5 py-4 bg-surface rounded-2xl border border-white/5 active:border-white/15"
      >
        <View className="flex-1 pr-3">
          <Text className="text-text-secondary text-base font-medium">
            Swap it, don't fight it
          </Text>
          <Text className="text-text-muted text-sm mt-0.5">
            0.0 drinks that actually taste right.
          </Text>
        </View>
        <Text className="text-text-muted text-base">→</Text>
      </Pressable>
    </Animated.View>
  );
}

function ChoosingPrompt() {
  const { data: choseToday } = useChoicesDoneToday();
  const { choosingDismissed, dismissChoosing } = useAppStore();
  const router = useRouter();

  // Evening ritual — from 5pm, once a day, until they've recorded a choice.
  const isEvening = new Date().getHours() >= 17;

  if (choseToday || choosingDismissed || !isEvening) return null;

  return (
    <Animated.View entering={FadeIn.duration(400)} className="mx-6 mt-4">
      <Card className="border border-white/10">
        <Text className="text-text-muted text-sm font-semibold tracking-widest uppercase mb-2">
          This evening
        </Text>
        <Text className="text-text-primary text-lg font-semibold mb-1">
          Today I chose…
        </Text>
        <Text className="text-text-secondary text-base mb-5 leading-relaxed">
          Not a streak — a record of who you're becoming.
        </Text>
        <View className="flex-row gap-2">
          <Pressable
            onPress={dismissChoosing}
            className="flex-1 items-center py-3 rounded-xl bg-surface border border-white/8 active:border-white/20"
          >
            <Text className="text-text-muted text-base font-medium">Later</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push('/session/choosing')}
            className="flex-1 items-center py-3 rounded-xl bg-accent active:bg-accent-dark"
          >
            <Text className="text-white text-base font-semibold">Choose</Text>
          </Pressable>
        </View>
      </Card>
    </Animated.View>
  );
}

function CounsellorCard() {
  const router = useRouter();
  return (
    <Animated.View entering={FadeIn.duration(400)} className="mx-6 mt-3">
      <Pressable
        onPress={async () => {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push('/counsellors');
        }}
        className="flex-row items-center justify-between px-5 py-4 bg-surface rounded-2xl border border-white/5 active:border-white/15"
      >
        <View className="flex-1 pr-3">
          <Text className="text-text-secondary text-base font-medium">
            Find a counsellor
          </Text>
          <Text className="text-text-muted text-sm mt-0.5">
            Verified professionals, when you want a human in your corner.
          </Text>
        </View>
        <Text className="text-text-muted text-base">→</Text>
      </Pressable>
    </Animated.View>
  );
}

export default function HomeScreen() {
  useSmartReminder();
  useWidgetSync();
  return (
    <SafeArea>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 48 }}
      >
        <GreetingHeader />
        <MonthlyRecapCard />
        <AnchorsCard />
        <DailyGameCard />
        <SwapsCard />
        <MoodCheckin />
        <MorningReflectionPrompt />
        <ChoosingPrompt />
        <DrinkingSession />
        <CounsellorCard />
        <HomeFeed />
      </ScrollView>
      <PauseModal />
    </SafeArea>
  );
}
