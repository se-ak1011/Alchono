import React from 'react';
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

function rgba(hex: string, a: number): string {
  const h = hex.replace('#', '');
  return `rgba(${parseInt(h.slice(0, 2), 16)}, ${parseInt(h.slice(2, 4), 16)}, ${parseInt(h.slice(4, 6), 16)}, ${a})`;
}

function actionIcon(url: string): keyof typeof Feather.glyphMap {
  if (url.startsWith('tel:')) return 'phone';
  if (url.startsWith('sms:')) return 'message-circle';
  if (url.startsWith('internal:')) return 'arrow-right';
  return 'external-link';
}

function useOpen() {
  const router = useRouter();
  return (r: Resource) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (r.url.startsWith('internal:')) router.push(r.url.replace('internal:', '') as any);
    else Linking.openURL(r.url).catch(() => {});
  };
}

/** A chip that IS the link — one tap calls, texts or opens. No reveal. */
function ResourceChip({ r, onPress }: { r: Resource; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={`${r.title}. ${r.action}`}
      className="flex-row items-center gap-2.5 rounded-2xl px-3 py-2.5 active:opacity-80"
      style={{ backgroundColor: rgba(PLUM, 0.1), borderWidth: 1, borderColor: rgba(PLUM, 0.28) }}
    >
      <Feather name={actionIcon(r.url)} size={15} color={PLUM} />
      <View style={{ flex: 1 }}>
        <Text className="text-text-primary text-[14px] font-semibold leading-tight" numberOfLines={2}>{r.title}</Text>
        <Text style={{ color: PLUM, fontSize: 11.5, fontWeight: '600' }} numberOfLines={1}>{r.action}</Text>
      </View>
    </Pressable>
  );
}

function Scene({
  pose,
  eyebrow,
  items,
  flip,
  delay,
}: {
  pose: CompanionPose;
  eyebrow: string;
  items: Resource[];
  flip: boolean;
  delay: number;
}) {
  const { pose: poseSrc } = useCompanion();
  const open = useOpen();
  return (
    <Animated.View
      entering={FadeInDown.duration(400).delay(delay)}
      style={{ flexDirection: flip ? 'row-reverse' : 'row', alignItems: 'center', gap: 6, marginBottom: 22 }}
    >
      <View style={{ width: 150, alignItems: 'center' }} pointerEvents="none">
        <CompanionArt source={poseSrc(pose)} width={148} height={172} />
      </View>
      <View style={{ flex: 1, gap: 8 }}>
        <Text
          className="text-xs font-semibold tracking-widest uppercase"
          style={{ color: PLUM, textAlign: flip ? 'right' : 'left', marginBottom: 2 }}
        >
          {eyebrow}
        </Text>
        {items.map((r) => (
          <ResourceChip key={r.title} r={r} onPress={() => open(r)} />
        ))}
      </View>
    </Animated.View>
  );
}

export default function ResourcesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const open = useOpen();
  const profile = useAuthStore((s) => s.profile);
  const interested = (profile?.preferences as any)?.interestedInAlternatives === true;

  const all: Resource[] = [
    ...RESOURCE_SECTIONS.flatMap((s) => s.items),
    ...(interested ? SWAPS_SECTION.items : []),
  ];
  const byTitle = Object.fromEntries(all.map((r) => [r.title, r] as const));
  const pick = (titles: string[]) => titles.map((t) => byTitle[t]).filter(Boolean) as Resource[];

  // Three ways to reach out, one pose each — calls first so 999 is instant.
  const scenes = [
    { pose: 'call' as CompanionPose, eyebrow: 'Call', titles: ['Emergency — 999', 'Samaritans', 'NHS 111', 'Drinkline', 'Alcoholics Anonymous'] },
    { pose: 'text' as CompanionPose, eyebrow: 'Text', titles: ['Shout', '7 Cups'] },
    { pose: 'door' as CompanionPose, eyebrow: 'Meetings', titles: ['AA meeting finder', 'SMART Recovery UK', 'Find a counsellor'] },
  ];
  const used = new Set(scenes.flatMap((s) => s.titles));
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

        {more.length > 0 ? (
          <View style={{ marginTop: 4 }}>
            <Text className="text-xs font-semibold tracking-widest uppercase mb-2.5 px-1" style={{ color: '#817B91' }}>
              More support
            </Text>
            <View style={{ gap: 8 }}>
              {more.map((r) => (
                <ResourceChip key={r.title} r={r} onPress={() => open(r)} />
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
