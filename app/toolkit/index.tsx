import React from 'react';
import { View, Text, ScrollView, Pressable, Dimensions } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { CompanionArt } from '@/components/ui/CompanionArt';
import { ZoneGlow } from '@/components/ui/ZoneGlow';
import { OrbitChip } from '@/components/ui/OrbitChip';
import {
  CATEGORY_META,
  CATEGORY_ORDER,
  toolsByCategory,
  type ToolkitCategory,
} from '@/lib/toolkit';
import { useCompanion } from '@/hooks/useCompanion';
import { ZONES } from '@/lib/zones';
import { headingShadow } from '@/styles';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const H_PAD = 22;
const GAP = 12;
const BOOK_W = (SCREEN_WIDTH - H_PAD * 2 - GAP * 2) / 3;
const BOOK_H = BOOK_W * 1.36;

function rgba(hex: string, a: number): string {
  const h = hex.replace('#', '');
  return `rgba(${parseInt(h.slice(0, 2), 16)}, ${parseInt(h.slice(2, 4), 16)}, ${parseInt(h.slice(4, 6), 16)}, ${a})`;
}

// One quiet emblem per category, stamped on the book cover.
const CATEGORY_ICON: Record<ToolkitCategory, keyof typeof Feather.glyphMap> = {
  'in-the-moment': 'zap',
  understand: 'book-open',
  triggers: 'alert-triangle',
  'planning-ahead': 'calendar',
  stress: 'wind',
  sleep: 'moon',
  relationships: 'users',
  identity: 'compass',
  'after-a-slip': 'refresh-ccw',
  motivation: 'star',
};

// Each book is a WASH, not a colour — a dark cover carrying only a faint breath
// of its accent, the same low-opacity tint the pages use. The shelf reads as a
// feeling: dim, cohesive, cosy — not a row of bright spines.
const CATEGORY_ACCENT: Record<ToolkitCategory, string> = {
  'in-the-moment': '#6FA3B0',
  understand: '#B296D0',
  triggers: '#C98A90',
  'planning-ahead': '#94C4A6',
  stress: '#8E93C8',
  sleep: '#8A85C0',
  relationships: '#C59BB8',
  identity: '#A6B58A',
  'after-a-slip': '#C6A87A',
  motivation: '#CDBE86',
};

function Book({
  cat,
  count,
  onPress,
}: {
  cat: ToolkitCategory;
  count: number;
  onPress: () => void;
}) {
  const accent = CATEGORY_ACCENT[cat];
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${CATEGORY_META[cat].label}, ${count} ${count === 1 ? 'read' : 'reads'}`}
      style={{ width: BOOK_W }}
      className="active:opacity-80"
    >
      <View
        style={{
          height: BOOK_H,
          borderRadius: 6,
          backgroundColor: rgba(accent, 0.15),
          borderWidth: 1,
          borderColor: rgba(accent, 0.26),
          paddingTop: 12,
          paddingRight: 10,
          paddingBottom: 12,
          paddingLeft: 16,
          justifyContent: 'space-between',
          overflow: 'hidden',
          shadowColor: '#000',
          shadowOpacity: 0.5,
          shadowRadius: 8,
          shadowOffset: { width: -2, height: 6 },
          elevation: 5,
        }}
      >
        {/* Spine: a darker gutter with a thin highlight, so it reads as a book. */}
        <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 6, backgroundColor: 'rgba(0,0,0,0.30)' }} />
        <View style={{ position: 'absolute', left: 6, top: 0, bottom: 0, width: 2, backgroundColor: 'rgba(255,255,255,0.06)' }} />

        {/* Bookmark ribbon with the read count. */}
        <View style={{ position: 'absolute', top: -1, right: 12, width: 16, alignItems: 'center' }}>
          <View style={{ width: 16, height: 26, backgroundColor: '#C9A24A', borderBottomLeftRadius: 2, borderBottomRightRadius: 2, alignItems: 'center', justifyContent: 'flex-start', paddingTop: 3 }}>
            <Text style={{ color: '#2b2416', fontSize: 10, fontWeight: '800' }}>{count}</Text>
          </View>
          <View style={{ width: 0, height: 0, borderLeftWidth: 8, borderRightWidth: 8, borderTopWidth: 6, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: '#C9A24A' }} />
        </View>

        <Feather name={CATEGORY_ICON[cat]} size={15} color={rgba(accent, 0.9)} />
        <Text style={{ fontFamily: 'SkinnyCustard', fontSize: 19, lineHeight: 20, color: '#f3ecdf' }} numberOfLines={3}>
          {CATEGORY_META[cat].label}
        </Text>
      </View>
    </Pressable>
  );
}

function Ledge() {
  return (
    <View style={{ height: 12, marginTop: -2, marginHorizontal: 6, borderRadius: 2, backgroundColor: '#2b2018' }}>
      <View style={{ height: 2, borderTopLeftRadius: 2, borderTopRightRadius: 2, backgroundColor: 'rgba(214,170,120,0.22)' }} />
    </View>
  );
}

export default function ToolkitScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { pose } = useCompanion();

  const cats = CATEGORY_ORDER.filter((c) => toolsByCategory(c).length > 0);
  const rows: ToolkitCategory[][] = [];
  for (let i = 0; i < cats.length; i += 3) rows.push(cats.slice(i, i + 3));

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#201D28',
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }}
    >
      <ZoneGlow zone="reading" />
      <Animated.View
        entering={FadeIn.duration(300)}
        className="flex-row items-center gap-4 px-6 pt-4 pb-2"
      >
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={{ color: '#817B91', fontSize: 18 }}>←</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ ...headingShadow, fontSize: 34 }}>Reading Corner</Text>
          <Text style={{ color: '#817B91', fontSize: 15, marginTop: 2 }}>
            Pick one off the shelf.
          </Text>
        </View>
      </Animated.View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: H_PAD, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Companion reading in the corner, above her shelf. */}
        <View style={{ alignItems: 'flex-end', marginTop: -4, marginBottom: 6, marginRight: 6 }} pointerEvents="none">
          <CompanionArt source={pose('reading')} width={140} height={168} />
        </View>

        {rows.map((row, ri) => (
          <Animated.View key={ri} entering={FadeInDown.duration(320).delay(Math.min(ri * 80, 320))} style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', gap: GAP, alignItems: 'flex-end' }}>
              {row.map((cat) => (
                <Book
                  key={cat}
                  cat={cat}
                  count={toolsByCategory(cat).length}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push({ pathname: '/toolkit/c/[cat]', params: { cat } });
                  }}
                />
              ))}
            </View>
            <Ledge />
          </Animated.View>
        ))}

        {/* The one chip we want everywhere. */}
        <View className="items-center mt-2 mb-1">
          <OrbitChip
            label={ZONES.urge.label}
            emergency
            onPress={() => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              router.push(ZONES.urge.route as any);
            }}
          />
        </View>

        {/* Gentle safety note */}
        <View className="bg-surface rounded-2xl px-5 py-4 mt-3 border border-white/8">
          <Text className="text-text-secondary text-sm leading-relaxed">
            This is self-help, not medical advice. If you drink heavily every
            day, stopping suddenly can be dangerous — please talk to a doctor
            about cutting down safely.
          </Text>
          <Pressable
            onPress={() => router.push('/support/resources')}
            className="mt-3 self-start"
            hitSlop={8}
          >
            <Text className="text-accent text-sm font-semibold">
              Need someone right now? →
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
