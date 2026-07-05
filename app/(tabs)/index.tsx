import React from 'react';
import { ScrollView, View, Text, Pressable, Image } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeArea } from '@/components/ui/SafeArea';
import { Card } from '@/components/ui/Card';
import { GreetingHeader } from '@/components/home/GreetingHeader';
import { MoodCheckin } from '@/components/home/MoodCheckin';
import { DrinkingSession } from '@/components/home/DrinkingSession';
import { AnchorsCard } from '@/components/home/AnchorsCard';
import { PauseModal } from '@/components/home/PauseModal';
import { useGoals, daysUntil } from '@/hooks/useGoals';
import { useUrgeStats, useAfMonthCount } from '@/hooks/useVictories';
import { useReflectionDoneToday } from '@/hooks/useJournal';
import { useChoicesDoneToday } from '@/hooks/useChoices';
import { useMonthlyRecap } from '@/hooks/useMonthlyRecap';
import { useSmartReminder } from '@/hooks/useSmartReminder';
import { useWidgetSync } from '@/hooks/useWidgetSync';
import { useAppStore } from '@/store/appStore';

const HOME_COMPANION_IMAGE_WIDTH = 140;
const HOME_COMPANION_IMAGE_HEIGHT = 165;
// Clip the container to roughly knee (show top ~85% of the image).
const HOME_COMPANION_CROP_HEIGHT = 140;

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
    <Animated.View entering={FadeIn.duration(400)} className="mx-6 mt-3 flex-row gap-3">
      <Pressable
        onPress={async () => {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push('/session/games');
        }}
        className="flex-1 px-5 py-3 bg-surface rounded-2xl border border-white/5 active:border-white/15"
      >
        <Text className="text-text-secondary text-base font-medium">Games</Text>
        <Text className="text-text-muted text-sm mt-0.5">Give your mind something else.</Text>
      </Pressable>
      <Pressable
        onPress={async () => {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push('/session/good-feed');
        }}
        className="flex-1 px-5 py-3 bg-surface rounded-2xl border border-white/5 active:border-white/15"
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
    <Animated.View
      entering={FadeIn.duration(400)}
      className="mx-6 mt-3"
    >
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

function HomeSecondaryCards() {
  const router = useRouter();
  const { data: allGoals = [] } = useGoals();
  const { data: urgeStats } = useUrgeStats();
  const { data: afMonth = 0 } = useAfMonthCount();

  const activeGoals = allGoals.filter((g) => !g.completed_at);
  const firstGoal = activeGoals[0] ?? null;

  const victories: string[] = [];
  const urgesBeaten = urgeStats?.allTimePassed ?? 0;
  if (urgesBeaten > 0) {
    victories.push(`${urgesBeaten} tough moment${urgesBeaten === 1 ? '' : 's'} you got through`);
  }
  if (afMonth > 0) {
    victories.push(`${afMonth} alcohol-free day${afMonth === 1 ? '' : 's'} this month`);
  }
  const victoryLine = victories.join(' · ');

  return (
    <Animated.View entering={FadeIn.duration(400)} className="flex-row mx-6 mt-3 items-start" style={{ gap: 12 }}>
      {/* Looking Forward To */}
      <Pressable
        className="flex-1"
        style={{ minHeight: 124 }}
        onPress={async () => {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push('/goals');
        }}
      >
        <Card className="border border-white/5 h-full">
          <Text className="text-text-muted text-xs font-semibold tracking-widest uppercase mb-2">
            Looking Forward To
          </Text>
          {firstGoal ? (
            <>
              <Text className="text-text-secondary text-sm leading-relaxed" numberOfLines={3}>
                {firstGoal.text}
              </Text>
              {firstGoal.target_date && (
                <Text className="text-text-muted text-xs mt-2">
                  {daysUntil(firstGoal.target_date) <= 0
                    ? 'now'
                    : `${daysUntil(firstGoal.target_date)}d`}
                </Text>
              )}
              {activeGoals.length > 1 && (
                <Text className="text-text-muted text-xs mt-1">
                  +{activeGoals.length - 1} more →
                </Text>
              )}
            </>
          ) : (
            <Text className="text-text-muted text-sm">+ Add something to look forward to</Text>
          )}
        </Card>
      </Pressable>

      {/* Progress */}
      <View className="flex-1" style={{ minHeight: 112 }}>
        <Card className="border border-white/5 h-full">
          <Text className="text-text-muted text-xs font-semibold tracking-widest uppercase mb-2">
            Progress
          </Text>
          {victoryLine ? (
            <Text className="text-text-secondary text-sm leading-relaxed" numberOfLines={4}>
              ◆ {victoryLine}
            </Text>
          ) : (
            <Text className="text-text-muted text-sm">Your wins will appear here.</Text>
          )}
        </Card>
      </View>
    </Animated.View>
  );
}

function ExploreAlchonoCard() {
  const router = useRouter();
  return (
    <Animated.View entering={FadeIn.duration(400)} className="mx-6 mt-3">
      <Pressable
        onPress={async () => {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push('/ecosystem');
        }}
        className="flex-row items-center justify-between px-5 py-3.5 bg-surface rounded-2xl border border-white/5 active:border-white/15"
      >
        <View className="flex-1 pr-3">
          <Text className="text-text-secondary text-base font-medium">Explore Alchono</Text>
          <Text className="text-text-muted text-sm mt-0.5">
            Toolkit, games, letters, and more support paths.
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
        {/* Character (left) + Reasons card (right) */}
        <View className="flex-row mx-6 mt-2 items-start" style={{ gap: 12 }}>
          {/* Ambient halo sits outside the clip container so it bleeds softly */}
          <View
            style={{
              shadowColor: '#7B6FA0',
              shadowOpacity: 0.26,
              shadowRadius: 34,
              shadowOffset: { width: 0, height: 0 },
              borderRadius: 999,
              backgroundColor: 'rgba(96,84,124,0.18)',
            }}
          >
            <View
              style={{
                width: HOME_COMPANION_IMAGE_WIDTH,
                height: HOME_COMPANION_CROP_HEIGHT,
                overflow: 'hidden',
              }}
            >
              <Image
                source={require('../../assets/companions/image_01_standing.png')}
                accessible={false}
                style={{
                  width: HOME_COMPANION_IMAGE_WIDTH,
                  height: HOME_COMPANION_IMAGE_HEIGHT,
                  opacity: 0.86,
                }}
                resizeMode="contain"
              />
            </View>
          </View>
          <View className="flex-1">
          <AnchorsCard inline compact />
          </View>
        </View>
        <HomeSecondaryCards />
        <MonthlyRecapCard />
        <DailyGameCard />
        <ExploreAlchonoCard />
        <MoodCheckin />
        <MorningReflectionPrompt />
        <ChoosingPrompt />
        <DrinkingSession />
      </ScrollView>
      <PauseModal />
    </SafeArea>
  );
}
