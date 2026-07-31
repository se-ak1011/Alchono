import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Linking } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { ZoneGlow } from '@/components/ui/ZoneGlow';
import { CompanionArt } from '@/components/ui/CompanionArt';
import { useCompanion } from '@/hooks/useCompanion';
import * as Haptics from 'expo-haptics';
import { RESOURCE_SECTIONS, SWAPS_SECTION, type Resource } from '@/lib/resources';
import { useAuthStore } from '@/store/authStore';
import { headingShadow } from '@/styles';
import type { CompanionPose } from '@/lib/companions';

const PLUM = '#A082BE';

// Short, self-explanatory chip labels — a number or a name, nothing to read.
const LABEL: Record<string, string> = {
  'Emergency — 999': '999',
  'NHS 111': '111',
  'Samaritans': 'Samaritans',
  'Drinkline': 'Drinkline',
  'Alcoholics Anonymous': 'AA helpline',
  'Shout': 'Shout',
  '7 Cups': '7 Cups',
  'AA meeting finder': 'AA meetings',
  'SMART Recovery UK': 'SMART Recovery',
  'Find a counsellor': 'Counsellor',
  'NHS alcohol advice': 'NHS advice',
  'Recovery ecosystem': 'Ecosystem',
  'Alcohol-free alternatives': 'Swaps',
};

// Family/affected-people services are deliberately NOT shown here — that support
// belongs on an affected-person account, and sitting it under the user's own
// meetings can read as shame. See docs/places.md.
const EXCLUDE_HEADINGS = new Set(['For the people around you']);

function rgba(hex: string, a: number): string {
  const h = hex.replace('#', '');
  return `rgba(${parseInt(h.slice(0, 2), 16)}, ${parseInt(h.slice(2, 4), 16)}, ${parseInt(h.slice(4, 6), 16)}, ${a})`;
}

function actionIcon(url: string): keyof typeof Feather.glyphMap {
  if (url.startsWith('tel:')) return 'phone';
  if (url.startsWith('sms:')) return 'message-circle';
  return 'external-link';
}

function openResource(r: Resource, router: ReturnType<typeof useRouter>) {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  if (r.url.startsWith('internal:')) router.push(r.url.replace('internal:', '') as any);
  else Linking.openURL(r.url).catch(() => {});
}

/** A chip that IS the link. Bare label + mode icon; a trailing arrow only when
 *  it opens something (meetings), which then explain themselves in a popup. */
function Chip({ r, arrow, onPress }: { r: Resource; arrow?: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={r.title}
      className="flex-row items-center gap-2.5 rounded-2xl px-3.5 py-2.5 active:opacity-80"
      style={{ backgroundColor: rgba(PLUM, 0.1), borderWidth: 1, borderColor: rgba(PLUM, 0.28) }}
    >
      <Feather name={actionIcon(r.url)} size={15} color={PLUM} />
      <Text className="text-text-primary text-[15px] font-semibold flex-1" numberOfLines={1}>
        {LABEL[r.title] ?? r.title}
      </Text>
      {arrow ? <Feather name="chevron-right" size={16} color={rgba(PLUM, 0.8)} /> : null}
    </Pressable>
  );
}

/** Meetings open a small "what is this" card first, then out to the site. */
function MeetingSheet({ r, onClose }: { r: Resource; onClose: () => void }) {
  const router = useRouter();
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 60, alignItems: 'center', justifyContent: 'center', padding: 28 }}>
      <Animated.View entering={FadeIn.duration(140)} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(8,6,11,0.6)' }} onPress={onClose} />
      </Animated.View>
      <Animated.View entering={FadeInDown.duration(200)} style={{ width: '100%', maxWidth: 360, backgroundColor: '#241f2b', borderRadius: 22, borderWidth: 1, borderColor: 'rgba(236,233,241,0.1)', padding: 22 }}>
        <Text className="text-text-primary text-xl font-semibold mb-2">{r.title}</Text>
        <Text className="text-text-secondary text-sm leading-relaxed mb-5">{r.description}</Text>
        <View className="flex-row gap-2">
          <Pressable onPress={onClose} className="flex-1 rounded-full py-3 items-center active:opacity-70" style={{ backgroundColor: 'rgba(236,233,241,0.06)', borderWidth: 1, borderColor: 'rgba(236,233,241,0.12)' }}>
            <Text className="text-text-secondary text-sm font-semibold">Not now</Text>
          </Pressable>
          <Pressable onPress={() => { Linking.openURL(r.url).catch(() => {}); onClose(); }} className="flex-1 rounded-full py-3 items-center active:opacity-80" style={{ backgroundColor: rgba(PLUM, 0.9) }}>
            <Text className="text-bg text-sm font-bold">Open website</Text>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

function Scene({
  pose, eyebrow, items, flip, delay, onMeeting,
}: {
  pose: CompanionPose; eyebrow: string; items: Resource[]; flip: boolean; delay: number;
  onMeeting?: (r: Resource) => void;
}) {
  const { pose: poseSrc } = useCompanion();
  const router = useRouter();
  return (
    <Animated.View
      entering={FadeInDown.duration(400).delay(delay)}
      style={{ flexDirection: flip ? 'row-reverse' : 'row', alignItems: 'center', gap: 6, marginBottom: 22 }}
    >
      <View style={{ width: 150, alignItems: 'center' }} pointerEvents="none">
        <CompanionArt source={poseSrc(pose)} width={148} height={172} />
      </View>
      <View style={{ flex: 1, gap: 8 }}>
        <Text className="text-xs font-semibold tracking-widest uppercase" style={{ color: PLUM, textAlign: flip ? 'right' : 'left', marginBottom: 2 }}>
          {eyebrow}
        </Text>
        {items.map((r) => (
          <Chip key={r.title} r={r} arrow={!!onMeeting} onPress={() => (onMeeting ? onMeeting(r) : openResource(r, router))} />
        ))}
      </View>
    </Animated.View>
  );
}

export default function ResourcesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const profile = useAuthStore((s) => s.profile);
  const interested = (profile?.preferences as any)?.interestedInAlternatives === true;
  const [meeting, setMeeting] = useState<Resource | null>(null);

  const all: Resource[] = [
    ...RESOURCE_SECTIONS.filter((s) => !EXCLUDE_HEADINGS.has(s.heading)).flatMap((s) => s.items),
    ...(interested ? SWAPS_SECTION.items : []),
  ];
  const byTitle = Object.fromEntries(all.map((r) => [r.title, r] as const));
  const pick = (titles: string[]) => titles.map((t) => byTitle[t]).filter(Boolean) as Resource[];

  const scenes = [
    { pose: 'call' as CompanionPose, eyebrow: 'Call', titles: ['Emergency — 999', 'Samaritans', 'NHS 111', 'Drinkline', 'Alcoholics Anonymous'] },
    { pose: 'text' as CompanionPose, eyebrow: 'Text', titles: ['Shout'] },
  ];
  const meetingTitles = ['AA meeting finder', 'SMART Recovery UK'];
  const meetings = pick(meetingTitles);
  const used = new Set([...scenes.flatMap((s) => s.titles), ...meetingTitles]);
  const more = all.filter((r) => !used.has(r.title));

  return (
    <View style={{ flex: 1, backgroundColor: '#201D28', paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <ZoneGlow zone="support" intensity={0.55} />
      <Animated.View entering={FadeIn.duration(300)} className="flex-row items-center gap-4 px-6 pt-4 pb-1">
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={{ color: '#817B91', fontSize: 18 }}>←</Text>
        </Pressable>
        <Text className="text-text-primary text-2xl font-semibold tracking-tight" style={headingShadow}>
          Resources
        </Text>
      </Animated.View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, paddingTop: 8 }} showsVerticalScrollIndicator={false}>
        <Text className="text-text-muted text-xs leading-relaxed mb-5 px-1">
          UK services, free unless noted. Tap to call, text or open — right there.
        </Text>

        {scenes.map((s, i) => (
          <Scene key={s.eyebrow} pose={s.pose} eyebrow={s.eyebrow} items={pick(s.titles)} flip={i % 2 === 1} delay={100 + i * 90} />
        ))}

        {meetings.length > 0 ? (
          <Scene pose="door" eyebrow="Meetings" items={meetings} flip={false} delay={280} onMeeting={setMeeting} />
        ) : null}

        {more.length > 0 ? (
          <View style={{ marginTop: 4 }}>
            <Text className="text-xs font-semibold tracking-widest uppercase mb-2.5 px-1" style={{ color: '#817B91' }}>
              More
            </Text>
            <View style={{ gap: 8 }}>
              {more.map((r) => (
                <Chip key={r.title} r={r} onPress={() => openResource(r, router)} />
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>

      {meeting ? <MeetingSheet r={meeting} onClose={() => setMeeting(null)} /> : null}
    </View>
  );
}
