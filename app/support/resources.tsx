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
import { RESOURCE_SECTIONS, type Resource } from '@/lib/resources';
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
  'NHS alcohol advice': 'NHS advice',
  'AA meeting finder': 'AA meetings',
  'SMART Recovery UK': 'SMART Recovery',
};

// Family/affected-people services are deliberately NOT shown here — that support
// belongs on an affected-person account, and sitting it under the user's own
// meetings can read as shame. See docs/places.md.
const EXCLUDE_HEADINGS = new Set(['For the people around you']);

function rgba(hex: string, a: number): string {
  const h = hex.replace('#', '');
  return `rgba(${parseInt(h.slice(0, 2), 16)}, ${parseInt(h.slice(2, 4), 16)}, ${parseInt(h.slice(4, 6), 16)}, ${a})`;
}

function openResource(r: Resource, router: ReturnType<typeof useRouter>) {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  if (r.url.startsWith('internal:')) router.push(r.url.replace('internal:', '') as any);
  else Linking.openURL(r.url).catch(() => {});
}

/** An orbit-style chip that IS the link. SkinnyCustard pill + plum dot; a
 *  trailing arrow only when it opens a page (meetings), which then explain
 *  themselves in a popup first. */
function Chip({ r, arrow, onPress }: { r: Resource; arrow?: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={r.title}
      className="active:opacity-70"
      style={{
        minHeight: 38,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 19,
        backgroundColor: 'rgba(20,18,24,0.9)',
        borderWidth: 1,
        borderColor: 'rgba(236,233,241,0.14)',
        shadowColor: '#000',
        shadowOpacity: 0.28,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
      }}
    >
      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: PLUM }} />
      <Text style={{ fontFamily: 'SkinnyCustard', fontSize: 20, lineHeight: 24, color: '#ECE9F1' }} numberOfLines={1}>
        {LABEL[r.title] ?? r.title}
      </Text>
      {arrow ? <Feather name="chevron-right" size={16} color={rgba(PLUM, 0.85)} /> : null}
    </Pressable>
  );
}

/** Meetings open a small "what is this" card first, then out to the site. */
function MeetingSheet({ r, onClose }: { r: Resource; onClose: () => void }) {
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
      style={{ flexDirection: flip ? 'row-reverse' : 'row', alignItems: 'center', gap: 6, marginBottom: 24 }}
    >
      <View style={{ width: 150, alignItems: 'center' }} pointerEvents="none">
        <CompanionArt source={poseSrc(pose)} width={148} height={172} />
      </View>
      <View style={{ flex: 1, gap: 9, alignItems: flip ? 'flex-end' : 'flex-start' }}>
        <Text className="text-xs font-semibold tracking-widest uppercase" style={{ color: PLUM, marginBottom: 2 }}>
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
  const [meeting, setMeeting] = useState<Resource | null>(null);

  const all: Resource[] = RESOURCE_SECTIONS.filter((s) => !EXCLUDE_HEADINGS.has(s.heading)).flatMap((s) => s.items);
  const byTitle = Object.fromEntries(all.map((r) => [r.title, r] as const));
  const pick = (titles: string[]) => titles.map((t) => byTitle[t]).filter(Boolean) as Resource[];

  const scenes = [
    { pose: 'call' as CompanionPose, eyebrow: 'Call', titles: ['Emergency — 999', 'Samaritans', 'NHS 111', 'Drinkline', 'Alcoholics Anonymous'] },
    { pose: 'text' as CompanionPose, eyebrow: 'Text', titles: ['Shout', 'NHS alcohol advice', '7 Cups'] },
  ];
  const meetings = pick(['AA meeting finder', 'SMART Recovery UK']);

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
      </ScrollView>

      {meeting ? <MeetingSheet r={meeting} onClose={() => setMeeting(null)} /> : null}
    </View>
  );
}
