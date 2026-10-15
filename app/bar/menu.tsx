import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { RECIPES } from '@/data/recipes';

const ACCENT = '#E0B080';
function rgba(hex: string, a: number) {
  const h = hex.replace('#', '');
  return `rgba(${parseInt(h.slice(0, 2), 16)}, ${parseInt(h.slice(2, 4), 16)}, ${parseInt(h.slice(4, 6), 16)}, ${a})`;
}

/**
 * The bar menu — a bottom sheet over the Café-Bar listing every 0.0 drink. The
 * board in either bar view opens this (one big tap instead of fiddly per-line
 * targets); each row opens that drink's recipe, and the last row is the 0.0
 * recommendations. Presented as a transparent modal so the bar shows through.
 */
export default function BarMenu() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const close = () => router.back();
  const go = (path: string) => router.push(path as any);

  return (
    <View style={{ flex: 1 }}>
      <Animated.View entering={FadeIn.duration(160)} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(8,6,11,0.6)' }} onPress={close} />
      </Animated.View>

      <Animated.View
        entering={FadeInDown.duration(260)}
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, maxHeight: '86%', backgroundColor: '#241f2b', borderTopLeftRadius: 26, borderTopRightRadius: 26, borderWidth: 1, borderColor: 'rgba(236,233,241,0.1)', paddingTop: 10 }}
      >
        <View style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(236,233,241,0.2)', marginBottom: 10 }} />
        <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: insets.bottom + 28 }} showsVerticalScrollIndicator={false}>
          <Text style={{ color: '#F4EFFA', fontFamily: 'PatrickHand', fontSize: 30, marginBottom: 2 }}>The Bar</Text>
          <Text style={{ color: '#B9B2C7', fontSize: 14, lineHeight: 20, marginBottom: 16 }}>
            Everything here is 0.0. Pick one — the making is half the point.
          </Text>

          {RECIPES.map((r) => (
            <Pressable
              key={r.id}
              onPress={() => go(`/recipe/${r.id}`)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderTopWidth: 1, borderColor: 'rgba(236,233,241,0.08)' }}
              className="active:opacity-60"
            >
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#ECE9F1', fontSize: 17, fontFamily: 'PatrickHand' }}>{r.name}</Text>
                <Text style={{ color: '#9A93A8', fontSize: 13, lineHeight: 18, marginTop: 1 }} numberOfLines={2}>{r.tagline}</Text>
              </View>
              <View style={{ backgroundColor: rgba(ACCENT, 0.15), borderColor: rgba(ACCENT, 0.4), borderWidth: 1, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 }}>
                <Text style={{ color: ACCENT, fontSize: 11, fontFamily: 'Inter_600SemiBold' }}>{r.minutes} min</Text>
              </View>
              <Feather name="chevron-right" size={18} color="#6f6880" />
            </Pressable>
          ))}

          {/* The 0.0 recommendations — the "ask the barista" row. */}
          <Pressable
            onPress={() => go('/support/recommendations')}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 18, paddingVertical: 14, paddingHorizontal: 14, borderRadius: 14, backgroundColor: rgba(ACCENT, 0.1), borderWidth: 1, borderColor: rgba(ACCENT, 0.3) }}
            className="active:opacity-70"
          >
            <Feather name="message-circle" size={18} color={ACCENT} />
            <Text style={{ color: '#F4EFFA', fontSize: 15, fontFamily: 'PatrickHand', flex: 1 }}>Ask the barista for 0.0 recommendations</Text>
            <Feather name="chevron-right" size={18} color={rgba(ACCENT, 0.7)} />
          </Pressable>

          <Pressable onPress={close} className="mt-6 self-center rounded-full px-6 py-2.5 active:opacity-70" style={{ backgroundColor: 'rgba(236,233,241,0.06)', borderWidth: 1, borderColor: 'rgba(236,233,241,0.12)' }}>
            <Text style={{ color: '#B9B2C7', fontSize: 14, fontWeight: '600' }}>Close</Text>
          </Pressable>
        </ScrollView>
      </Animated.View>
    </View>
  );
}
