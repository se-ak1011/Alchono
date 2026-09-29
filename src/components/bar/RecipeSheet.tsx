import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Recipe } from '@/data/recipes';

const ACCENT = '#E0B080';

function rgba(hex: string, a: number): string {
  const h = hex.replace('#', '');
  return `rgba(${parseInt(h.slice(0, 2), 16)}, ${parseInt(h.slice(2, 4), 16)}, ${parseInt(h.slice(4, 6), 16)}, ${a})`;
}

/**
 * The recipe popup — a bottom sheet over a dimmed backdrop. Shared by the
 * Café-Bar boards (each drink opens it via /recipe/[id]) and the Barista screen.
 */
export function RecipeSheet({ recipe, onClose }: { recipe: Recipe; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, zIndex: 60 }}>
      <Animated.View entering={FadeIn.duration(160)} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(8,6,11,0.6)' }} onPress={onClose} />
      </Animated.View>
      <Animated.View
        entering={FadeInDown.duration(260)}
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, maxHeight: '82%', backgroundColor: '#241f2b', borderTopLeftRadius: 26, borderTopRightRadius: 26, borderWidth: 1, borderColor: 'rgba(236,233,241,0.1)', paddingTop: 10 }}
      >
        <View style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(236,233,241,0.2)', marginBottom: 8 }} />
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 28 }} showsVerticalScrollIndicator={false}>
          <View className="flex-row items-center justify-between mb-1.5">
            <Text className="text-text-primary text-2xl font-semibold flex-1 pr-3">{recipe.name}</Text>
            <View style={{ backgroundColor: rgba(ACCENT, 0.15), borderColor: rgba(ACCENT, 0.4), borderWidth: 1 }} className="rounded-full px-2.5 py-1">
              <Text style={{ color: ACCENT, fontSize: 12, fontFamily: 'Inter_600SemiBold' }}>{recipe.minutes} min</Text>
            </View>
          </View>
          <Text className="text-text-secondary text-base leading-relaxed mb-4">{recipe.tagline}</Text>

          <Text className="text-text-muted text-xs font-semibold tracking-widest uppercase mb-1.5">You’ll need</Text>
          <Text className="text-text-secondary text-sm leading-relaxed mb-4">{recipe.need.join('  ·  ')}</Text>

          <View style={{ gap: 8 }}>
            {recipe.steps.map((step, idx) => (
              <View key={idx} className="flex-row gap-2.5">
                <Text style={{ color: ACCENT, fontSize: 14, fontFamily: 'Inter_600SemiBold', width: 16 }}>{idx + 1}</Text>
                <Text className="text-text-primary text-sm leading-relaxed flex-1">{step}</Text>
              </View>
            ))}
          </View>

          <Pressable onPress={onClose} className="mt-6 self-center rounded-full px-6 py-2.5 active:opacity-70" style={{ backgroundColor: 'rgba(236,233,241,0.06)', borderWidth: 1, borderColor: 'rgba(236,233,241,0.12)' }}>
            <Text className="text-text-secondary text-sm font-semibold">Close</Text>
          </Pressable>
        </ScrollView>
      </Animated.View>
    </View>
  );
}
