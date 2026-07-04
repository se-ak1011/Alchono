import React, { useState } from 'react';
import { ScrollView, View, Text, Pressable, useWindowDimensions } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { SafeArea } from '@/components/ui/SafeArea';
import { Card } from '@/components/ui/Card';
import { InsightCard } from '@/components/insights/InsightCard';
import { MoodChart } from '@/components/insights/MoodChart';
import { PatternChart } from '@/components/insights/PatternChart';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useInsights, useTotalPauses, type InsightData } from '@/hooks/useInsights';
import { useUrgeStats, useAfDaysCount } from '@/hooks/useVictories';
import { useChoiceStats } from '@/hooks/useChoices';
import { headingShadow } from '@/styles';

type Period = 7 | 30 | 90;

const PERIODS: { value: Period; label: string }[] = [
  { value: 7,  label: '7D' },
  { value: 30, label: '30D' },
  { value: 90, label: '90D' },
];

const DIFFICULT_MOODS = ['anxious', 'low', 'struggling', 'angry', 'lonely', 'frustrated'];
const DAY_NAMES = ['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays'];

function computePatterns(data: InsightData[], period: number): string[] {
  const patterns: string[] = [];
  if (data.length < 3) return patterns;

  const sessionDays = data.filter((d) => d.hadSession).length;
  const checkinDays = data.filter((d) => d.mood).length;

  // Day-of-week with most sessions
  const dayCounts = new Array(7).fill(0);
  for (const d of data) {
    if (d.hadSession) {
      dayCounts[new Date(d.date + 'T12:00:00').getDay()]++;
    }
  }
  const maxCount = Math.max(...dayCounts);
  if (maxCount >= 2) {
    patterns.push(`${DAY_NAMES[dayCounts.indexOf(maxCount)]} tend to be harder.`);
  }

  // Mood–session correlation
  if (sessionDays >= 3) {
    const difficultSessionDays = data.filter(
      (d) => d.hadSession && d.mood && DIFFICULT_MOODS.some((m) => d.mood!.includes(m)),
    ).length;
    const pct = Math.round((difficultSessionDays / sessionDays) * 100);
    if (pct >= 50) {
      patterns.push(`Difficult emotions appear on ${pct}% of drinking days.`);
    }
  }

  // Check-in consistency
  if (checkinDays >= 5) {
    const pct = Math.round((checkinDays / period) * 100);
    patterns.push(`You've checked in ${pct}% of days this period. That takes something.`);
  }

  // Top trigger
  const triggerCounts: Record<string, number> = {};
  for (const d of data) {
    for (const t of d.triggers) {
      triggerCounts[t] = (triggerCounts[t] ?? 0) + 1;
    }
  }
  const topTrigger = Object.entries(triggerCounts).sort(([, a], [, b]) => b - a)[0];
  if (topTrigger && topTrigger[1] >= 2) {
    patterns.push(`${topTrigger[0]} appears as a trigger most often.`);
  }

  return patterns;
}

export default function InsightsScreen() {
  const [period, setPeriod] = useState<Period>(30);
  const { data: insights, isLoading } = useInsights(period);
  const { data: totalPauses = 0 } = useTotalPauses(period);
  const { data: urgeStats } = useUrgeStats(period);
  const { data: alcoholFreeDays = 0 } = useAfDaysCount(period);
  const { data: choiceStats } = useChoiceStats(); // all-time — this only grows
  const { width } = useWindowDimensions();
  const router = useRouter();

  const checkinDays = insights?.filter((d) => d.mood).length ?? 0;
  const sessionDayCount = insights?.filter((d) => d.hadSession).length ?? 0;

  const triggerCounts = insights?.reduce<Record<string, number>>((acc, d) => {
    for (const t of d.triggers) {
      acc[t] = (acc[t] ?? 0) + 1;
    }
    return acc;
  }, {});

  const sortedTriggers = Object.entries(triggerCounts ?? {})
    .sort(([, a], [, b]) => b - a)
    .map(([label, count]) => ({ label, count }));

  // The good, counted the same way — so it gets its own visible space.
  const goodCounts = insights?.reduce<Record<string, number>>((acc, d) => {
    for (const g of d.wentWell) {
      acc[g] = (acc[g] ?? 0) + 1;
    }
    return acc;
  }, {});

  const sortedGood = Object.entries(goodCounts ?? {})
    .sort(([, a], [, b]) => b - a)
    .map(([label, count]) => ({ label, count }));

  const patterns = computePatterns(insights ?? [], period);

  return (
    <SafeArea>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View className="flex-row items-start justify-between px-6 pt-4 pb-3">
          <View>
            <Text className="text-text-primary text-2xl font-semibold tracking-tight" style={headingShadow}>
              Patterns
            </Text>
            <Text className="text-text-secondary text-sm mt-1">
              Your record.
            </Text>
          </View>
          <Pressable
            onPress={() => router.push('/timeline')}
            className="bg-surface rounded-xl px-3.5 py-2.5 border border-white/8 active:border-white/20 mt-1"
          >
            <Text className="text-text-secondary text-sm font-medium">Your story →</Text>
          </Pressable>
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
          <LoadingSpinner message="Reading your patterns…" />
        ) : (
          <Animated.View entering={FadeIn.duration(400)}>
            {/* Stat cards */}
            <View className="flex-row mx-6 gap-3 mb-3">
              <InsightCard
                title="Urges beaten"
                value={urgeStats?.periodPassed ?? 0}
                symbol="◆"
                subtitle={`in ${period} days`}
              />
              <InsightCard
                title="Alcohol-free"
                value={alcoholFreeDays}
                symbol="○"
                subtitle="marked days"
              />
            </View>
            <View className="flex-row mx-6 gap-3 mb-4">
              <InsightCard
                title="Check-ins"
                value={checkinDays}
                symbol="◇"
                subtitle={`of ${period} days`}
              />
              <InsightCard
                title="Pauses"
                value={totalPauses}
                symbol="—"
                subtitle="taken"
              />
            </View>

            {/* Member-initiated snapshot — a page they can simply show across
                a table, with sharing as a choice on it. Free by design; the
                paid portal is for continuous remote visibility, not this. */}
            <Pressable
              onPress={() => router.push(`/summary?period=${period}` as any)}
              className="mx-6 mb-4 py-3.5 rounded-2xl bg-surface border border-white/8 items-center active:border-white/20"
            >
              <Text className="text-text-secondary text-sm font-semibold">
                See my summary →
              </Text>
            </Pressable>

            {/* Today I chose — identity over streaks, all-time and only grows */}
            {!!choiceStats && choiceStats.total > 0 && (
              <View className="mx-6 mb-4">
                <Card elevated>
                  <Text className="text-text-muted text-xs font-semibold tracking-widest uppercase mb-2">
                    Choices you've made
                  </Text>
                  <Text className="text-text-primary text-4xl font-semibold">
                    {choiceStats.total}
                  </Text>
                  <Text className="text-text-secondary text-sm leading-relaxed mt-1 mb-3">
                    positive choices, one at a time. Not a streak — a record of
                    who you're becoming.
                  </Text>
                  {choiceStats.breakdown.length > 0 && (
                    <PatternChart
                      title=""
                      triggers={choiceStats.breakdown.map((b) => ({
                        label: b.label.replace(/^to /, ''),
                        count: b.count,
                      }))}
                    />
                  )}
                </Card>
              </View>
            )}

            {/* Pattern insights */}
            {patterns.length > 0 && (
              <View className="mx-6 mb-4 gap-3">
                {patterns.map((pattern, i) => (
                  <Card key={i} className="border border-accent/15">
                    <Text className="text-text-muted text-xs font-medium tracking-wide uppercase mb-2">
                      Pattern
                    </Text>
                    <Text className="text-text-primary text-sm leading-relaxed">
                      {pattern}
                    </Text>
                  </Card>
                ))}
              </View>
            )}

            {/* Good things — given its own space, before the hard stuff */}
            {sortedGood.length > 0 && (
              <View className="mx-6 mb-4">
                <Card elevated>
                  <PatternChart triggers={sortedGood} title="What’s been good" />
                  <Text className="text-text-muted text-xs leading-relaxed mt-3">
                    The things worth holding onto. Reflect on any day to add to this.
                  </Text>
                </Card>
              </View>
            )}

            {/* Mood chart */}
            <View className="mx-6 mb-4">
              <Card elevated>
                <Text className="text-text-primary font-semibold text-sm mb-3">
                  Mood over time
                </Text>
                <MoodChart data={insights ?? []} width={width - 80} />
              </Card>
            </View>

            {/* Trigger patterns */}
            {sortedTriggers.length > 0 && (
              <View className="mx-6 mb-4">
                <Card elevated>
                  <PatternChart triggers={sortedTriggers} title="What’s been hard" />
                </Card>
              </View>
            )}

            {/* Empty state / encouragement */}
            {patterns.length === 0 && (
              <View className="mx-6">
                <Card className="border border-white/5">
                  <Text className="text-text-secondary text-sm leading-relaxed text-center">
                    Patterns will appear as you check in. Every entry helps.
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
