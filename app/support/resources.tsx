import React from 'react';
import { View, Text, ScrollView, Pressable, Linking } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { ZoneGlow } from '@/components/ui/ZoneGlow';
import * as Haptics from 'expo-haptics';
import { RESOURCE_SECTIONS, SWAPS_SECTION, type Resource } from '@/lib/resources';
import { useAuthStore } from '@/store/authStore';
import { headingShadow } from '@/styles';

function rgba(hex: string, a: number): string {
  const h = hex.replace('#', '');
  return `rgba(${parseInt(h.slice(0, 2), 16)}, ${parseInt(h.slice(2, 4), 16)}, ${parseInt(h.slice(4, 6), 16)}, ${a})`;
}

/** What the tap does, from the url scheme — so the row reads at a glance. */
function actionMeta(url: string): { icon: keyof typeof Feather.glyphMap } {
  if (url.startsWith('tel:')) return { icon: 'phone' };
  if (url.startsWith('sms:')) return { icon: 'message-circle' };
  if (url.startsWith('internal:')) return { icon: 'arrow-right' };
  return { icon: 'external-link' };
}

function ResourceRow({ r, accent }: { r: Resource; accent: string }) {
  const router = useRouter();
  const { icon } = actionMeta(r.url);
  const open = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (r.url.startsWith('internal:')) router.push(r.url.replace('internal:', '') as any);
    else Linking.openURL(r.url).catch(() => {});
  };
  return (
    <Pressable
      onPress={open}
      className="flex-row items-center gap-3 rounded-2xl px-3.5 py-2.5 mb-2 active:opacity-80"
      style={{ backgroundColor: rgba(accent, 0.07), borderWidth: 1, borderColor: rgba(accent, 0.22) }}
    >
      <View
        style={{
          width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center',
          backgroundColor: rgba(accent, 0.16), borderWidth: 1, borderColor: rgba(accent, 0.42),
        }}
      >
        <Feather name={icon} size={17} color={accent} />
      </View>
      <View className="flex-1">
        <Text className="text-text-primary text-[15px] font-semibold">{r.title}</Text>
        <Text className="text-text-muted text-xs mt-0.5" numberOfLines={1}>
          {r.description}
        </Text>
      </View>
      <View
        className="rounded-full px-3 py-1.5"
        style={{ backgroundColor: rgba(accent, 0.16), borderWidth: 1, borderColor: rgba(accent, 0.4) }}
      >
        <Text style={{ color: accent, fontSize: 12, fontWeight: '700' }} numberOfLines={1}>
          {r.action}
        </Text>
      </View>
    </Pressable>
  );
}

export default function ResourcesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const profile = useAuthStore((s) => s.profile);
  const interested = (profile?.preferences as any)?.interestedInAlternatives === true;
  const sections = interested ? [...RESOURCE_SECTIONS, SWAPS_SECTION] : RESOURCE_SECTIONS;

  const DANGER = '#C98282'; // crisis — urgent but not alarming
  const SUPPORT = '#A082BE'; // everything else — calm plum

  return (
    <View style={{ flex: 1, backgroundColor: '#201D28', paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <ZoneGlow zone="support" intensity={0.55} />
      <Animated.View entering={FadeIn.duration(300)} className="flex-row items-center gap-4 px-6 pt-4 pb-2">
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={{ color: '#817B91', fontSize: 18 }}>←</Text>
        </Pressable>
        <Text className="text-text-primary text-2xl font-semibold tracking-tight" style={headingShadow}>
          Resources
        </Text>
      </Animated.View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40, paddingTop: 8 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-text-muted text-xs leading-relaxed mb-5">
          UK services, free unless noted. Tap to call, text or open.
        </Text>

        {sections.map((section, i) => {
          const accent = i === 0 ? DANGER : SUPPORT;
          return (
            <View key={section.heading} className="mb-6">
              <Text
                className="text-xs font-semibold tracking-widest uppercase mb-3"
                style={{ color: accent }}
              >
                {section.heading}
              </Text>
              {section.items.map((r) => (
                <ResourceRow key={r.title} r={r} accent={accent} />
              ))}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
