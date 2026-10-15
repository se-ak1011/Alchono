import React, { useState } from 'react';
import * as Haptics from 'expo-haptics';
import { View, Alert, Share, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { DrawnForm, FieldZone, TickZone, UsernameZone, ValueZone, type Rect } from '@/components/paper/DrawnForm';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';
import { useInsights, useTotalPauses, useStreak } from '@/hooks/useInsights';
import { useUrgeStats, useAfDaysCount } from '@/hooks/useVictories';
import { useDrinksDiary } from '@/hooks/useDrinkEntries';
import { buildSummaryHtml, exportSummaryPdf } from '@/lib/summaryPdf';

/**
 * Recovery — Marta's hand-drawn drawer, opened from the drawers around the
 * house. Three objects, each reaching into its own close-up:
 *   • the folded "For when it gets hard" note → My Plan (4 blanks over the
 *     recovery_plan column, written in place)
 *   • the "Useful People" notebook → the resources (/resources/home)
 *   • the "Take to GP" envelope → the shareable summary close-up (period +
 *     the six tracked counts + Save/print PDF + Share as text)
 * Zones carry rough default rects; position with the pencil editor + Export.
 */

const recoveryDrawer = require('../../assets/folder/recovery-drawer.png');
const planNote = require('../../assets/folder/recovery-plan.png');
const gpNote = require('../../assets/folder/recovery-gp.png');
const resCall = require('../../assets/folder/recovery-res-call.png');
const resText = require('../../assets/folder/recovery-res-text.png');
const resMeetings = require('../../assets/folder/recovery-res-meetings.png');

type ResTab = 'call' | 'text' | 'meetings';

// The "Useful People" notebook — one tabbed close-up (Call / Text / Meetings),
// each line a tap to call / text / open.
const RES_LINES: Record<ResTab, { id: string; url: string; y: number }[]> = {
  call: [
    { id: 'res_999', url: 'tel:999', y: 0.300 },
    { id: 'res_samaritans', url: 'tel:116123', y: 0.372 },
    { id: 'res_111', url: 'tel:111', y: 0.444 },
    { id: 'res_drinkline', url: 'tel:03001231110', y: 0.516 },
    { id: 'res_aa', url: 'tel:08009177650', y: 0.588 },
  ],
  text: [
    { id: 'res_shout', url: 'sms:85258', y: 0.300 },
    { id: 'res_nhs', url: 'https://www.nhs.uk/live-well/alcohol-advice/', y: 0.375 },
    { id: 'res_7cups', url: 'https://www.7cups.com', y: 0.448 },
  ],
  meetings: [
    { id: 'res_aameet', url: 'https://www.alcoholics-anonymous.org.uk/aa-meetings/find-a-meeting', y: 0.300 },
    { id: 'res_smart', url: 'https://smartrecovery.org.uk', y: 0.375 },
  ],
};
const RES_IMG: Record<ResTab, number> = { call: resCall, text: resText, meetings: resMeetings };
// Tab bookmarks drawn down the right edge.
const RES_TABS = {
  call: { x: 0.87, y: 0.255, w: 0.12, h: 0.11 } as Rect,
  text: { x: 0.87, y: 0.400, w: 0.12, h: 0.11 } as Rect,
  meetings: { x: 0.87, y: 0.555, w: 0.12, h: 0.11 } as Rect,
};

type RecoveryPlan = { reasons?: string; people?: string; goTo?: string; warningSigns?: string };

const PERIODS = [30, 90, 180, 365];
const fmtDate = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

// Rough default rects — drag + Export exact positions in the editor.
const R = {
  // drawer
  rec_plan: { x: 0.04, y: 0.31, w: 0.55, h: 0.40 } as Rect,
  rec_resources: { x: 0.55, y: 0.22, w: 0.38, h: 0.28 } as Rect,
  rec_gp: { x: 0.33, y: 0.52, w: 0.62, h: 0.21 } as Rect,
  // my plan — four quadrants
  pl_reasons: { x: 0.08, y: 0.30, w: 0.34, h: 0.16 } as Rect,
  pl_people: { x: 0.56, y: 0.32, w: 0.36, h: 0.16 } as Rect,
  pl_warning: { x: 0.08, y: 0.65, w: 0.34, h: 0.14 } as Rect,
  pl_goto: { x: 0.56, y: 0.65, w: 0.36, h: 0.14 } as Rect,
  // gp summary
  gp_username: { x: 0.45, y: 0.235, w: 0.45, h: 0.03 } as Rect,
  gp_range: { x: 0.30, y: 0.285, w: 0.60, h: 0.03 } as Rect,
  gp_p30: { x: 0.11, y: 0.325, w: 0.07, h: 0.035 } as Rect,
  gp_p90: { x: 0.33, y: 0.325, w: 0.07, h: 0.035 } as Rect,
  gp_p180: { x: 0.54, y: 0.325, w: 0.07, h: 0.035 } as Rect,
  gp_p365: { x: 0.79, y: 0.325, w: 0.07, h: 0.035 } as Rect,
  gp_v_streak: { x: 0.52, y: 0.395, w: 0.42, h: 0.05 } as Rect,
  gp_v_afdays: { x: 0.52, y: 0.455, w: 0.42, h: 0.05 } as Rect,
  gp_v_sessions: { x: 0.52, y: 0.515, w: 0.42, h: 0.05 } as Rect,
  gp_v_pauses: { x: 0.52, y: 0.580, w: 0.42, h: 0.05 } as Rect,
  gp_v_urges: { x: 0.52, y: 0.645, w: 0.42, h: 0.05 } as Rect,
  gp_v_checkin: { x: 0.52, y: 0.710, w: 0.42, h: 0.05 } as Rect,
  gp_pdf: { x: 0.08, y: 0.800, w: 0.84, h: 0.04 } as Rect,
  gp_share: { x: 0.08, y: 0.845, w: 0.84, h: 0.04 } as Rect,
} as const;

export default function RecoveryScreen() {
  const router = useRouter();
  const { user, profile, setProfile } = useAuthStore();
  const [phase, setPhase] = useState<'drawer' | 'plan' | 'gp' | 'resources'>('drawer');
  const [resTab, setResTab] = useState<ResTab>('call');

  // ---- My Plan (recovery_plan column) --------------------------------------
  const existingPlan = ((profile as any)?.recovery_plan ?? {}) as RecoveryPlan;
  const [reasons, setReasons] = useState(existingPlan.reasons ?? '');
  const [people, setPeople] = useState(existingPlan.people ?? '');
  const [goTo, setGoTo] = useState(existingPlan.goTo ?? '');
  const [warningSigns, setWarningSigns] = useState(existingPlan.warningSigns ?? '');

  const savePlan = async () => {
    if (!user) return;
    const plan: RecoveryPlan = { reasons, people, goTo, warningSigns };
    if (profile) setProfile({ ...(profile as any), recovery_plan: plan });
    try {
      await (supabase.from('profiles') as any).update({ recovery_plan: plan }).eq('id', user.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert('Saved on device', 'We’ll sync your plan when the connection’s back.');
    }
  };

  // ---- GP summary (same tracked data as the old summary page) ---------------
  const username = profile?.username;
  const [period, setPeriod] = useState<number>(30);
  const { data: insights } = useInsights(period);
  const { data: totalPauses = 0 } = useTotalPauses(period);
  const { data: urgeStats } = useUrgeStats(period);
  const { data: alcoholFreeDays = 0 } = useAfDaysCount(period);
  const { data: streak } = useStreak();
  const { data: diary } = useDrinksDiary(7);

  const checkinDays = insights?.filter((d) => d.mood).length ?? 0;
  const sessionDayCount = insights?.filter((d) => d.hadSession).length ?? 0;
  const toDate = new Date();
  const fromDate = new Date(Date.now() - period * 86400000);
  const rangeLabel = `${fmtDate(fromDate)} – ${fmtDate(toDate)}`;
  const periodLabel = period === 365 ? '12 months' : `${period} days`;

  const rows = [
    { label: 'Days since last recorded drink', value: streak ? String(streak.streak) : '—' },
    { label: 'Alcohol-free days marked', value: `${alcoholFreeDays} of ${period}` },
    { label: 'Drinking sessions recorded', value: String(sessionDayCount) },
    { label: 'Pauses taken mid-session', value: String(totalPauses) },
    { label: 'Urges managed without drinking', value: String(urgeStats?.periodPassed ?? 0) },
    { label: 'Days checked in', value: `${checkinDays} of ${period}` },
  ];

  const [exporting, setExporting] = useState(false);
  const handleExportPdf = async () => {
    if (exporting) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExporting(true);
    try {
      const html = buildSummaryHtml({ name: username ?? 'Member', rangeLabel, periodLabel, generatedOn: fmtDate(toDate), rows, diary });
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
      `Generated ${fmtDate(toDate)} from the Alchono app. Figures are self-reported by the member.`,
      'Trends only — personal journals and conversations are private and not included.',
    ];
    await Share.share({ message: lines.join('\n') });
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0d0b12' }}>
      {phase === 'drawer' && (
        <DrawnForm source={recoveryDrawer} label="recovery-drawer" onBack={() => router.back()}>
          <LinkZone id="rec_plan" rect={R.rec_plan} onPress={() => setPhase('plan')} />
          <LinkZone id="rec_resources" rect={R.rec_resources} onPress={() => { setResTab('call'); setPhase('resources'); }} />
          <LinkZone id="rec_gp" rect={R.rec_gp} onPress={() => setPhase('gp')} />
        </DrawnForm>
      )}

      {phase === 'plan' && (
        <DrawnForm source={planNote} label="recovery-plan" onBack={() => { void savePlan(); setPhase('drawer'); }}>
          <FieldZone id="pl_reasons" rect={R.pl_reasons} value={reasons} onChangeText={setReasons} placeholder="The why, in your words…" multiline fontSize={15} />
          <FieldZone id="pl_people" rect={R.pl_people} value={people} onChangeText={setPeople} placeholder="Who you'll call…" multiline fontSize={15} />
          <FieldZone id="pl_warning" rect={R.pl_warning} value={warningSigns} onChangeText={setWarningSigns} placeholder="The early wobble…" multiline fontSize={15} />
          <FieldZone id="pl_goto" rect={R.pl_goto} value={goTo} onChangeText={setGoTo} placeholder="What actually works…" multiline fontSize={15} />
        </DrawnForm>
      )}

      {phase === 'gp' && (
        <DrawnForm source={gpNote} label="recovery-gp" onBack={() => setPhase('drawer')}>
          <UsernameZone id="gp_username" rect={R.gp_username} fontSize={16} />
          <ValueZone id="gp_range" rect={R.gp_range} text={rangeLabel} fontSize={14} numberOfLines={1} />
          <TickZone id="gp_p30" rect={R.gp_p30} mark="ring" value={period === 30} onToggle={() => setPeriod(30)} />
          <TickZone id="gp_p90" rect={R.gp_p90} mark="ring" value={period === 90} onToggle={() => setPeriod(90)} />
          <TickZone id="gp_p180" rect={R.gp_p180} mark="ring" value={period === 180} onToggle={() => setPeriod(180)} />
          <TickZone id="gp_p365" rect={R.gp_p365} mark="ring" value={period === 365} onToggle={() => setPeriod(365)} />
          <ValueZone id="gp_v_streak" rect={R.gp_v_streak} text={rows[0].value} />
          <ValueZone id="gp_v_afdays" rect={R.gp_v_afdays} text={rows[1].value} />
          <ValueZone id="gp_v_sessions" rect={R.gp_v_sessions} text={rows[2].value} />
          <ValueZone id="gp_v_pauses" rect={R.gp_v_pauses} text={rows[3].value} />
          <ValueZone id="gp_v_urges" rect={R.gp_v_urges} text={rows[4].value} />
          <ValueZone id="gp_v_checkin" rect={R.gp_v_checkin} text={rows[5].value} />
          <LinkZone id="gp_pdf" rect={R.gp_pdf} onPress={handleExportPdf} />
          <LinkZone id="gp_share" rect={R.gp_share} onPress={handleShareText} />
        </DrawnForm>
      )}

      {phase === 'resources' && (
        <DrawnForm
          source={RES_IMG[resTab]}
          label={`recovery-res-${resTab}`}
          onBack={() => setPhase('drawer')}
        >
          {RES_LINES[resTab].map((line) => (
            <LinkZone
              key={line.id}
              id={line.id}
              rect={{ x: 0.07, y: line.y, w: 0.42, h: 0.05 }}
              onPress={() => Linking.openURL(line.url)}
            />
          ))}
          {/* Tab bookmarks down the right edge. */}
          <LinkZone id="res_tab_call" rect={RES_TABS.call} onPress={() => setResTab('call')} />
          <LinkZone id="res_tab_text" rect={RES_TABS.text} onPress={() => setResTab('text')} />
          <LinkZone id="res_tab_meetings" rect={RES_TABS.meetings} onPress={() => setResTab('meetings')} />
        </DrawnForm>
      )}
    </View>
  );
}

/** A tappable object — invisible over a drawn note / notebook / envelope / row. */
function LinkZone({ id, rect, onPress }: { id: string; rect: Rect; onPress: () => void }) {
  return (
    <TickZone id={id} rect={rect} value={false} onToggle={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); }} />
  );
}
