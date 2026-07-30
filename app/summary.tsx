import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Share, Alert } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ZoneGlow } from '@/components/ui/ZoneGlow';
import * as Haptics from 'expo-haptics';
import { Button } from '@/components/ui/Button';
import { useInsights, useTotalPauses, useStreak } from '@/hooks/useInsights';
import { useUrgeStats, useAfDaysCount, useTypicalUrgeMinutes } from '@/hooks/useVictories';
import { useAuthStore } from '@/store/authStore';
import { buildSummaryHtml, exportSummaryPdf } from '@/lib/summaryPdf';
import { headingShadow } from '@/styles';

/**
 * The member's summary as a page — designed to be physically shown across a
 * table (to a counsellor, a sponsor, a GP) without sending anything anywhere,
 * or shared as plain text to print/save. Sharing is a button, not the default.
 *
 * Reads only tracked data, so it's honest and GP-legible: an explicit reporting
 * period with dates, plain counts, and a clear self-report caveat. The clinical
 * screening questionnaire (e.g. AUDIT-C) and a true PDF export are separate,
 * later additions.
 */

const PERIODS = [30, 90, 180, 365];

function fmtDate(d: Date): string {
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function SummaryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ period?: string }>();
  const initialPeriod = PERIODS.includes(Number(params.period)) ? Number(params.period) : 30;
  const [period, setPeriod] = useState<number>(initialPeriod);

  const username = useAuthStore((st) => st.profile?.username);
  const { data: insights } = useInsights(period);
  const { data: totalPauses = 0 } = useTotalPauses(period);
  const { data: urgeStats } = useUrgeStats(period);
  const { data: alcoholFreeDays = 0 } = useAfDaysCount(period);
  const { data: typicalMinutes } = useTypicalUrgeMinutes();
  const { data: streak } = useStreak();

  const checkinDays = insights?.filter((d) => d.mood).length ?? 0;
  const sessionDayCount = insights?.filter((d) => d.hadSession).length ?? 0;

  const moodCounts: Record<string, number> = {};
  for (const d of insights ?? []) {
    if (d.mood) moodCounts[d.mood] = (moodCounts[d.mood] ?? 0) + 1;
  }
  const topMood = Object.entries(moodCounts).sort(([, a], [, b]) => b - a)[0]?.[0];

  const toDate = new Date();
  const fromDate = new Date(Date.now() - period * 86400000);
  const rangeLabel = `${fmtDate(fromDate)} – ${fmtDate(toDate)}`;
  const generatedOn = fmtDate(toDate);
  const periodLabel = period === 365 ? '12 months' : `${period} days`;

  const rows: { label: string; value: string }[] = [
    ...(streak ? [{ label: 'Days since last recorded drink', value: String(streak.streak) }] : []),
    { label: 'Alcohol-free days marked', value: `${alcoholFreeDays} of ${period}` },
    { label: 'Drinking sessions recorded', value: String(sessionDayCount) },
    { label: 'Pauses taken mid-session', value: String(totalPauses) },
    { label: 'Urges managed without drinking', value: String(urgeStats?.periodPassed ?? 0) },
    { label: 'Days checked in', value: `${checkinDays} of ${period}` },
    ...(topMood ? [{ label: 'Most common mood', value: topMood }] : []),
    ...(typicalMinutes ? [{ label: 'Urges typically pass in', value: `~${typicalMinutes} min` }] : []),
  ];

  const [exporting, setExporting] = useState(false);

  const handleExportPdf = async () => {
    if (exporting) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExporting(true);
    try {
      const html = buildSummaryHtml({
        name: username ?? 'Member',
        rangeLabel,
        periodLabel,
        generatedOn,
        rows,
      });
      await exportSummaryPdf(html);
    } catch (e) {
      Alert.alert('Could not create PDF', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleShareText = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const lines = [
      `Alcohol recovery summary — ${username ?? 'Member'}`,
      `Reporting period: ${rangeLabel} (${periodLabel})`,
      '',
      ...rows.map((r) => `• ${r.label}: ${r.value}`),
      '',
      `Generated ${generatedOn} from the Alchono app. Figures are self-reported by the member.`,
      'Trends only — personal journals and conversations are private and not included.',
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
        <View className="flex-1">
          <Text className="text-text-primary text-2xl font-semibold tracking-tight" style={headingShadow}>
            Your summary
          </Text>
          <Text className="text-text-muted text-sm mt-0.5">{rangeLabel}</Text>
        </View>
      </Animated.View>

      {/* Reporting period — GP-relevant windows, up to a year. */}
      <View className="flex-row mx-6 mt-2 mb-1 bg-surface rounded-xl p-1 border border-white/8">
        {PERIODS.map((value) => (
          <Pressable
            key={value}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setPeriod(value);
            }}
            className={`flex-1 py-2 rounded-lg items-center ${period === value ? 'bg-surface-2' : ''}`}
          >
            <Text className={`text-xs font-semibold ${period === value ? 'text-text-primary' : 'text-text-muted'}`}>
              {value === 365 ? '1Y' : `${value}D`}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          entering={FadeInDown.duration(400)}
          className="bg-surface rounded-3xl px-6 py-7 mt-3 border border-white/8"
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
            Alchono · recovery summary
          </Text>
          <Text className="text-text-primary text-xl font-semibold mt-1.5">
            {username ?? 'Member'}
          </Text>
          <Text className="text-text-muted text-sm mt-0.5 mb-5">
            {rangeLabel} · {periodLabel}
          </Text>

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
          Showing this screen is enough — nothing has been sent to anyone. Export
          a PDF to print, save to Files, or email to your GP.
        </Text>
      </ScrollView>

      <View className="px-6">
        <Button
          title={exporting ? 'Preparing PDF…' : 'Save or print PDF →'}
          variant="primary"
          size="md"
          fullWidth
          onPress={handleExportPdf}
        />
        <Pressable onPress={handleShareText} hitSlop={8} className="items-center py-3 active:opacity-60">
          <Text className="text-text-muted text-sm">Share as text instead</Text>
        </Pressable>
      </View>
    </View>
  );
}
