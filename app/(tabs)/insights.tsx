import React, { useState } from 'react';
import { ScrollView, View, Text, Pressable, useWindowDimensions } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeArea } from '@/components/ui/SafeArea';
import { Card } from '@/components/ui/Card';
import { InsightCard } from '@/components/insights/InsightCard';
import { MoodChart } from '@/components/insights/MoodChart';
import { PatternChart } from '@/components/insights/PatternChart';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useInsights, useStreak } from '@/hooks/useInsights';

type Period = 7 | 30 | 90;

const PERIODS: { value: Period; label: string }[] = [
  { value: 7, label: '7D' },
  { value: 30, label: '30D' },
  { value: 90, label: '90D' },
];

export default function InsightsScreen() {
  const [period, setPeriod] = useState<Period>(30);
  const { data: insights, isLoading } = useInsights(period);
  const { data: streakData } = useStreak();
  const { width } = useWindowDimensions();

  const sessionDays = insights?.filter((d) => d.hadSession).length ?? 0;
  const checkinDays = insights?.filter((d) => d.mood).length ?? 0;

  const triggerCounts = insights?.reduce<Record<string, number>>((acc, d) => {
    for (const t of d.triggers) {
      acc[t] = (acc[t] ?? 0) + 1;
    }
    return acc;
  }, {});

  const sortedTriggers = Object.entries(triggerCounts ?? {})
    .sort(([, a], [, b]) => b - a)
    .map(([label, count]) => ({ label, count }));

  return (
    <SafeArea>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View className="px-6 pt-4 pb-3">
          <Text className="text-text-primary text-2xl font-bold tracking-tight">
            Insights
          </Text>
          <Text className="text-text-secondary text-sm mt-1">
            Your patterns, clearly.
          </Text>
        </View>

        {/* Period selector */}
        <View className="flex-row mx-6 mb-4 bg-surface rounded-xl p-1">
          {PERIODS.map(({ value, label }) => (
            <Pressable
              key={value}
              onPress={() => setPeriod(value)}
              className={`flex-1 py-2 rounded-lg items-center ${
                period === value ? 'bg-surface-2' : ''
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  period === value ? 'text-text-primary' : 'text-text-muted'
                }`}
              >
                {label}
              </Text>
            </Pressable>
          ))}
        </View>

        {isLoading ? (
          <LoadingSpinner message="Analysing your data…" />
        ) : (
          <Animated.View entering={FadeIn.duration(400)}>
            {/* Stat cards */}
            <View className="flex-row mx-6 gap-3 mb-4">
              <InsightCard
                title="Day streak"
                value={streakData?.streak ?? 0}
                icon="🔥"
                subtitle={`${period}‑day period`}
              />
              <InsightCard
                title="Check-ins"
                value={checkinDays}
                icon="✍️"
                trend={checkinDays > sessionDays ? 'up' : 'neutral'}
              />
              <InsightCard
                title="Session days"
                value={sessionDays}
                icon="📍"
              />
            </View>

            {/* Mood chart */}
            <View className="mx-6 mb-4">
              <Card elevated>
                <Text className="text-text-primary font-semibold text-sm mb-3">
                  Mood over time
                </Text>
                <MoodChart
                  data={insights ?? []}
                  width={width - 80}
                />
              </Card>
            </View>

            {/* Trigger patterns */}
            <View className="mx-6 mb-4">
              <Card elevated>
                <PatternChart triggers={sortedTriggers} />
              </Card>
            </View>

            {/* Correlation insight */}
            {sessionDays > 0 && checkinDays > 0 && (
              <View className="mx-6">
                <Card className="border border-accent/15">
                  <Text className="text-text-muted text-xs font-medium tracking-wide uppercase mb-2">
                    Pattern
                  </Text>
                  <Text className="text-text-primary text-sm leading-relaxed">
                    You drank on{' '}
                    <Text className="text-accent font-semibold">{sessionDays}</Text>{' '}
                    of the last {period} days.
                    {sortedTriggers[0]
                      ? ` Your most common trigger was ${sortedTriggers[0].label.toLowerCase()}.`
                      : ' Keep logging to see your patterns.'}
                  </Text>
                </Card>
              </View>
            )}
          </Animated.View>
        )}
      </ScrollView>
    </SafeArea>
  );
}
