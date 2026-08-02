import React, { useState } from 'react';
import { View, Text, Pressable, FlatList, Platform } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { SafeArea } from '@/components/ui/SafeArea';
import { useDilemmas, type Dilemma, type DilemmaKind } from '@/hooks/useDilemmas';
import { FOOD } from '@/lib/food';

const SERIF = Platform.select({ ios: 'Georgia', default: 'serif' }) as string;
const MONO = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }) as string;
const S = FOOD.thought;
const PAPER = '#d8e0dd';
const INK = '#24302c';

const MODES: { key: DilemmaKind; label: string; blurb: string; cta: string }[] = [
  { key: 'aita', label: 'Everyday', blurb: "Someone's in the wrong. Cast your verdict, then see how everyone else saw it.", cta: 'Cast your verdict' },
  { key: 'deep', label: 'Deep', blurb: 'Harder questions with no easy answer — the kind that hold a mirror up. Choose, then reflect.', cta: 'Where do you stand?' },
];

function Wash() {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 320 }}>
      <LinearGradient colors={[S.wash, 'rgba(138,178,174,0.06)', 'rgba(32,29,40,0)']} locations={[0, 0.45, 1]} style={{ flex: 1 }} />
    </View>
  );
}

/** A dilemma, set as a letter to the page. */
function Letter({ item, i, cta, onPress }: { item: Dilemma; i: number; cta: string; onPress: () => void }) {
  return (
    <Animated.View entering={FadeInDown.duration(320).delay(Math.min(i * 55, 400))} style={{ transform: [{ rotate: i % 2 === 0 ? '-0.6deg' : '0.7deg' }] }}>
      <Pressable onPress={onPress} className="active:opacity-90" style={{ backgroundColor: PAPER, borderRadius: 3, paddingHorizontal: 18, paddingTop: 15, paddingBottom: 15, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.42, shadowRadius: 9, shadowOffset: { width: 0, height: 5 } }}>
        <Text style={{ fontFamily: SERIF, fontWeight: '700', fontSize: 18, lineHeight: 23, color: INK }}>{item.title}</Text>
        <Text style={{ fontFamily: SERIF, fontSize: 14.5, lineHeight: 21, color: 'rgba(0,0,0,0.72)', marginTop: 7 }} numberOfLines={3}>
          <Text style={{ fontStyle: 'italic' }}>Dear reader — </Text>{item.story}
        </Text>
        <View style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.18)', marginTop: 12, marginBottom: 10 }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontFamily: MONO, fontSize: 11.5, letterSpacing: 0.5, color: 'rgba(0,0,0,0.62)' }}>{cta}</Text>
          <Feather name="arrow-right" size={14} color="rgba(0,0,0,0.62)" />
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function ThoughtScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<DilemmaKind>('aita');
  const active = MODES.find((m) => m.key === mode)!;
  const { data: dilemmas = [], isLoading } = useDilemmas(mode);

  return (
    <SafeArea>
      <Wash />
      <View className="px-6 pt-4 pb-2 flex-row items-start gap-3">
        <Pressable onPress={() => router.back()} hitSlop={12} className="p-1 -ml-1 active:opacity-60">
          <Feather name="chevron-left" size={26} color="#B2ACC0" />
        </Pressable>
        <View className="flex-1">
          <Text style={{ fontFamily: MONO, fontSize: 10, letterSpacing: 2, color: '#817B91' }}>FOOD FOR THOUGHT</Text>
          <Text style={{ fontFamily: SERIF, fontWeight: '700', fontSize: 30, lineHeight: 34, color: '#ECE9F1', marginTop: 3 }}>
            The Letters Page
          </Text>
          <Text style={{ color: '#817B91', fontSize: 13, marginTop: 4 }}>{active.blurb}</Text>
        </View>
      </View>

      {/* Everyday | Deep — retro column tabs. */}
      <View className="mx-6 mt-2 mb-1 flex-row" style={{ gap: 8 }}>
        {MODES.map((m) => {
          const on = mode === m.key;
          return (
            <Pressable
              key={m.key}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setMode(m.key); }}
              style={{ flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 10, backgroundColor: on ? 'rgba(138,178,174,0.18)' : 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: on ? 'rgba(138,178,174,0.5)' : 'rgba(236,233,241,0.08)' }}
            >
              <Text style={{ fontFamily: MONO, fontSize: 12.5, letterSpacing: 1, color: on ? '#ECE9F1' : '#817B91' }}>{m.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <FlatList
        data={dilemmas}
        keyExtractor={(it) => it.id}
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 12, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <Letter
            item={item}
            i={index}
            cta={active.cta}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push({ pathname: '/thought/[id]', params: { id: item.id } }); }}
          />
        )}
        ListEmptyComponent={
          !isLoading ? (
            <Text style={{ fontFamily: MONO, fontSize: 13, color: '#817B91', textAlign: 'center', marginTop: 50, paddingHorizontal: 32, lineHeight: 21 }}>
              // the postbag is empty for now —{'\n'}new dilemmas on the way.
            </Text>
          ) : null
        }
      />
    </SafeArea>
  );
}
