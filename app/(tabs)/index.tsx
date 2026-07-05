import React from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeArea } from '@/components/ui/SafeArea';
import { Card } from '@/components/ui/Card';
import { CompanionArt } from '@/components/ui/CompanionArt';
import { GreetingHeader } from '@/components/home/GreetingHeader';
import { MoodCheckin } from '@/components/home/MoodCheckin';
import { AnchorsCard } from '@/components/home/AnchorsCard';
import { PauseModal } from '@/components/home/PauseModal';
import { useGoals, daysUntil } from '@/hooks/useGoals';
import { useUrgeStats, useAfMonthCount } from '@/hooks/useVictories';
import { useSmartReminder } from '@/hooks/useSmartReminder';
import { useWidgetSync } from '@/hooks/useWidgetSync';
import { useDrinkIntentSync } from '@/hooks/useDrinkIntentSync';

const HOME_COMPANION_IMAGE_WIDTH = 140;
const HOME_COMPANION_IMAGE_HEIGHT = 165;
const HOME_COMPANION_CROP_HEIGHT = 140;

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
  // Drain any drinks logged offline via the "I had a drink" App Intent.
  useDrinkIntentSync();
  return (
    <SafeArea>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 48 }}
      >
        <GreetingHeader />
        {/* Character (left) + Reasons card (right) */}
        <View className="flex-row mx-6 mt-2 items-start" style={{ gap: 12 }}>
          <CompanionArt
            source={require('../../assets/companions/image_01_standing.png')}
            width={HOME_COMPANION_IMAGE_WIDTH}
            height={HOME_COMPANION_IMAGE_HEIGHT}
            cropHeight={HOME_COMPANION_CROP_HEIGHT}
          />
          <View className="flex-1">
            <AnchorsCard inline compact />
          </View>
        </View>
        <HomeSecondaryCards />
        <MoodCheckin />
      </ScrollView>
      <PauseModal />
    </SafeArea>
  );
}
