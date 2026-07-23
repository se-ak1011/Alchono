import React from 'react';
import { View, Text, ScrollView, Pressable, Share } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ZoneGlow } from '@/components/ui/ZoneGlow';
import * as Haptics from 'expo-haptics';
import { Button } from '@/components/ui/Button';
import { useInsights, useTotalPauses } from '@/hooks/useInsights';
import { useUrgeStats, useAfDaysCount, useTypicalUrgeMinutes } from '@/hooks/useVictories';
import { useAuthStore } from '@/store/authStore';
import { headingShadow } from '@/styles';

/**
 * The member's summary as a page — designed to be physically shown across a
 * table (to a counsellor, a sponsor, a GP) without sending anything anywhere.
 * Sharing is a button, not the default.
 */
export default function SummaryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ period?: string }>();
  const period = ([7, 30, 90].includes(Number(params.period)) ? Number(params.period) : 30) as 7 | 30 | 90;

  const username = useAuthStore((st) => st.profile?.username);
  const { data: insights } = useInsights(period);
  const { data: totalPauses = 0 } = useTotalPauses(period);
  const { data: urgeStats } = useUrgeStats(period);
  const { data: alcoholFreeDays = 0 } = useAfDaysCount(period);
  const { data: typicalMinutes } = useTypicalUrgeMinutes();

  const checkinDays = insights?.filter((d) => d.mood).length ?? 0;
  const sessionDayCount = insights?.filter((d) => d.hadSession).length ?? 0;

  const moodCounts: Record<string, number> = {};
  for (const d of insights ?? []) {
    if (d.mood) moodCounts[d.mood] = (moodCounts[d.mood] ?? 0) + 1;
  }
  const topMood = Object.entries(moodCounts).sort(([, a], [, b]) => b - a)[0]?.[0];

  const generatedOn = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const rows: { label: string; value: string }[] = [
    { label: 'Alcohol-free days', value: String(alcoholFreeDays) },
    { label: 'Times you got through it', value: String(urgeStats?.periodPassed ?? 0) },
    { label: 'Check-ins', value: `${checkinDays} of ${period} days` },
    { label: 'Drinking sessions', value: String(sessionDayCount) },
    { label: 'Pauses taken mid-session', value: String(totalPauses) },
    ...(topMood ? [{ label: 'Most common mood', value: topMood }] : []),
    ...(typicalMinutes
      ? [{ label: 'These usually pass in', value: `~${typicalMinutes} min` }]
      : []),
  ];

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const lines = [
      `${username ?? 'My'} Alchono summary — last ${period} days`,
      '',
      ...rows.map((r) => `• ${r.label}: ${r.value}`),
      '',
      `Generated ${generatedOn} · self-reported, from the Alchono app.`,
      'Shared by the member. Trends only — journals and conversations stay private.',
    ];
    await Share.share({ message: lines.join('\n') });
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#201D28',
        paddingTop: insets.top,
        paddingBottom: insets.bottom + 12,
      }}
    >
      <ZoneGlow zone="me" intensity={0.55} />
      <Animated.View
        entering={FadeIn.duration(300)}
        className="flex-row items-center gap-4 px-6 pt-4 pb-2"
      >
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={{ color: '#817B91', fontSize: 18 }}>←</Text>
        </Pressable>
        <Text
          className="text-text-primary text-2xl font-semibold tracking-tight"
          style={headingShadow}
        >
          Last {period} days.
        </Text>
      </Animated.View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          entering={FadeInDown.duration(400)}
          className="bg-surface rounded-3xl px-6 py-7 mt-4 border border-white/8"
          style={{
            borderTopColor: 'rgba(255,255,255,0.15)',
            shadowColor: '#000000',
            shadowOpacity: 0.4,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 8 },
            elevation: 6,
          }}
        >
          <Text className="text-text-muted text-xs font-semibold tracking-widest uppercase">
            Alchono · member summary
          </Text>
          <Text className="text-text-primary text-xl font-semibold mt-1.5">
            {username ?? 'Member'}
          </Text>
          <Text className="text-text-muted text-sm mt-0.5 mb-5">{generatedOn}</Text>

          {rows.map((r, i) => (
            <View
              key={r.label}
              className={`flex-row items-center justify-between py-3.5 ${
                i > 0 ? 'border-t border-white/5' : ''
              }`}
            >
              <Text className="text-text-secondary text-base flex-1 pr-4">{r.label}</Text>
              <Text className="text-text-primary text-lg font-semibold">{r.value}</Text>
            </View>
          ))}

          <Text className="text-text-muted text-xs leading-relaxed mt-5">
            Self-reported, from the Alchono app. Trends only — journals and
            conversations stay private.
          </Text>
        </Animated.View>

        <Text className="text-text-muted text-sm text-center leading-relaxed mt-6 px-4">
          Showing this screen is enough — nothing has been sent to anyone.
          Sharing sends it as text you can print, save, or message.
        </Text>
      </ScrollView>

      <View className="px-6">
        <Button
          title="Share or save →"
          variant="primary"
          size="md"
          fullWidth
          onPress={handleShare}
        />
      </View>
    </View>
  );
}
