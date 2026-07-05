import React from 'react';
import { ScrollView, View, Text, Pressable, Image } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeArea } from '@/components/ui/SafeArea';
import { Card } from '@/components/ui/Card';
import { GreetingHeader } from '@/components/home/GreetingHeader';
import { MoodCheckin } from '@/components/home/MoodCheckin';
import { AnchorsCard } from '@/components/home/AnchorsCard';
import { PauseModal } from '@/components/home/PauseModal';
import { useGoals, daysUntil } from '@/hooks/useGoals';
import { useUrgeStats, useAfMonthCount } from '@/hooks/useVictories';
import { useChoicesDoneToday } from '@/hooks/useChoices';
import { useSmartReminder } from '@/hooks/useSmartReminder';
import { useWidgetSync } from '@/hooks/useWidgetSync';

const HOME_COMPANION_IMAGE_WIDTH = 140;
const HOME_COMPANION_IMAGE_HEIGHT = 165;
// Clip the container to roughly knee (show top ~85% of the image).
const HOME_COMPANION_CROP_HEIGHT = 140;

function TodaysChoicesCard() {
  const { data: choseToday } = useChoicesDoneToday();
  const router = useRouter();

  return (
    <Animated.View entering={FadeIn.duration(400)} className="mx-6 mt-3">
      <Card className="border border-white/10">
        <View className="flex-row items-start justify-between gap-4">
          <View className="flex-1">
            <Text className="text-text-muted text-sm font-semibold tracking-widest uppercase mb-2">
              Today's choices
            </Text>
            <Text className="text-text-primary text-lg font-semibold mb-1">
              {choseToday ? 'Recorded for today.' : 'Keep a record of today.'}
            </Text>
            <Text className="text-text-secondary text-base leading-relaxed">
              Not a streak — a record of who you're becoming.
            </Text>
          </View>
          <Pressable
            onPress={async () => {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/session/choosing');
            }}
            className="items-center justify-center px-4 py-3 rounded-xl bg-surface border border-white/8 active:border-white/20"
          >
            <Text className="text-text-secondary text-base font-medium">
              {choseToday ? 'Update' : 'Choose'}
            </Text>
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
          <View
            style={{
              width: HOME_COMPANION_IMAGE_WIDTH,
              height: HOME_COMPANION_CROP_HEIGHT,
            }}
          >
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: 18,
                right: 18,
                bottom: 10,
                height: 96,
                borderRadius: 999,
                backgroundColor: 'rgba(104,95,122,0.05)',
                shadowColor: '#E8D9C9',
                shadowOpacity: 0.06,
                shadowRadius: 18,
                shadowOffset: { width: 0, height: 4 },
              }}
            />
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: 30,
                right: 30,
                bottom: 20,
                height: 76,
                borderRadius: 999,
                backgroundColor: 'rgba(244,232,219,0.035)',
              }}
            />
            <View
              style={{
                width: HOME_COMPANION_IMAGE_WIDTH,
                height: HOME_COMPANION_CROP_HEIGHT,
                overflow: 'hidden',
              }}
            >
              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 14,
                  bottom: 0,
                  left: 14,
                  borderRadius: 24,
                  backgroundColor: 'rgba(246,238,229,0.03)',
                }}
              />
              <Image
                source={require('../../assets/companions/image_01_standing.png')}
                accessible={false}
                style={{
                  width: HOME_COMPANION_IMAGE_WIDTH,
                  height: HOME_COMPANION_IMAGE_HEIGHT,
                  opacity: 0.8,
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
        <MoodCheckin />
        <TodaysChoicesCard />
      </ScrollView>
      <PauseModal />
    </SafeArea>
  );
}
