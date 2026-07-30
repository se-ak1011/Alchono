import React from 'react';
import { View, Text, Pressable, FlatList } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { SafeArea } from '@/components/ui/SafeArea';
import { headingShadow } from '@/styles';

// A warm, kitchen-y accent — this is the "make something with your hands" tab.
const ACCENT = '#E0B080';

/**
 * Barista — the drink ritual, without the alcohol. The point of a drink was
 * never only the drink: it was the pouring, the holding, the sipping, the time
 * it filled. These occupy the same hands / mouth / minutes with things most
 * people already have in the kitchen.
 */
type Recipe = {
  id: string;
  name: string;
  tagline: string;
  minutes: number;
  need: string[];
  steps: string[];
};

const RECIPES: Recipe[] = [
  {
    id: 'sunrise-fizz',
    name: 'Sunrise Fizz',
    tagline: 'Long, cold and fizzy — the closest thing to a proper glass in your hand.',
    minutes: 4,
    need: ['Orange juice', 'Sparkling or cold water', 'Ice', 'A slice of orange (if you have one)'],
    steps: [
      'Fill a tall glass right up with ice — more than feels sensible.',
      'Pour in orange juice until it’s about a third full.',
      'Top slowly with sparkling water and watch it climb.',
      'Perch the orange slice on the rim. Hold it. Sip it slowly.',
    ],
  },
  {
    id: 'honey-lemon',
    name: 'Honey & Lemon Warmer',
    tagline: 'Something warm to wrap both hands around while it steeps.',
    minutes: 5,
    need: ['Hot water', 'Honey (or sugar)', 'Lemon (or a splash of bottled)', 'Cinnamon, optional'],
    steps: [
      'Boil the kettle. While it goes, squeeze the lemon into your favourite mug.',
      'Add a good spoon of honey.',
      'Pour over hot water and stir until the honey vanishes.',
      'Let it sit two minutes — the waiting is part of it. Then hold and sip.',
    ],
  },
  {
    id: 'cinnamon-steamer',
    name: 'Cinnamon Milk Steamer',
    tagline: 'Frothy, warm and quietly comforting. Whisking it is half the point.',
    minutes: 6,
    need: ['Milk (any kind)', 'Honey', 'A pinch of cinnamon'],
    steps: [
      'Warm a mug of milk gently in a pan — don’t let it boil.',
      'Stir in honey and the cinnamon.',
      'Whisk hard for a minute (a fork works) until it’s frothy on top.',
      'Pour back into the mug and dust a little more cinnamon over the foam.',
    ],
  },
  {
    id: 'slow-iced-tea',
    name: 'Slow Iced Tea',
    tagline: 'The one that makes you wait. Brew, cool, pour — a small ritual with time built in.',
    minutes: 8,
    need: ['A tea bag (any)', 'Hot water', 'Ice', 'Lemon or honey, optional'],
    steps: [
      'Brew a strong cup — leave the bag in a little longer than usual.',
      'Take it out and let it cool for a few minutes. Don’t rush this bit.',
      'Fill a glass with ice and pour the tea over — it’ll crackle.',
      'Add lemon or a little honey. Sip somewhere you can sit down.',
    ],
  },
  {
    id: 'mock-mojito',
    name: 'Mock Mojito',
    tagline: 'Muddling is oddly satisfying, and it keeps your hands properly busy.',
    minutes: 5,
    need: ['Sparkling water', 'Lime (or lemon)', 'Fresh mint, if you have it', 'Honey or sugar'],
    steps: [
      'Cut the lime into wedges and drop them in a glass with a little honey.',
      'If you’ve got mint, add a few leaves. Press and twist everything with a spoon.',
      'Fill the glass with ice.',
      'Top with sparkling water, stir, and taste. Adjust the lime to your mood.',
    ],
  },
  {
    id: 'golden-milk',
    name: 'Golden Milk',
    tagline: 'Warm, gold and grounding — a slow one for the end of a hard day.',
    minutes: 6,
    need: ['Milk (any kind)', 'Honey', 'Turmeric or cinnamon', 'A tiny pinch of black pepper'],
    steps: [
      'Warm a mug of milk in a pan on low.',
      'Whisk in a small spoon of turmeric (or cinnamon), honey, and the pinch of pepper.',
      'Keep it just below a simmer for a couple of minutes, stirring.',
      'Pour into a mug, wrap your hands around it, and take your time.',
    ],
  },
];

function Wash() {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 360 }}>
      <LinearGradient
        colors={['rgba(224,176,128,0.18)', 'rgba(224,176,128,0.05)', 'rgba(32,29,40,0)']}
        locations={[0, 0.45, 1]}
        style={{ flex: 1 }}
      />
    </View>
  );
}

function RecipeCard({ item, i }: { item: Recipe; i: number }) {
  return (
    <Animated.View entering={FadeInDown.duration(320).delay(Math.min(i * 45, 360))}>
      <View className="bg-surface rounded-3xl px-5 py-5 mb-3 border border-white/8">
        <View className="flex-row items-center justify-between mb-1.5">
          <Text className="text-text-primary text-lg font-semibold leading-snug flex-1 pr-3">{item.name}</Text>
          <View style={{ backgroundColor: 'rgba(224,176,128,0.15)', borderColor: 'rgba(224,176,128,0.4)', borderWidth: 1 }} className="rounded-full px-2.5 py-1">
            <Text style={{ color: ACCENT, fontSize: 12, fontFamily: 'Inter_600SemiBold' }}>{item.minutes} min</Text>
          </View>
        </View>
        <Text className="text-text-secondary text-sm leading-relaxed mb-3">{item.tagline}</Text>

        <Text className="text-text-muted text-xs font-semibold tracking-widest uppercase mb-1.5">You’ll need</Text>
        <Text className="text-text-secondary text-sm leading-relaxed mb-3">{item.need.join('  ·  ')}</Text>

        <View style={{ gap: 6 }}>
          {item.steps.map((step, idx) => (
            <View key={idx} className="flex-row gap-2.5">
              <Text style={{ color: ACCENT, fontSize: 14, fontFamily: 'Inter_600SemiBold', width: 16 }}>{idx + 1}</Text>
              <Text className="text-text-primary text-sm leading-relaxed flex-1">{step}</Text>
            </View>
          ))}
        </View>
      </View>
    </Animated.View>
  );
}

export default function BaristaScreen() {
  const router = useRouter();

  return (
    <SafeArea>
      <Wash />
      <View className="px-6 pt-4 pb-2 flex-row items-center gap-3">
        <Pressable onPress={() => router.back()} hitSlop={12} className="p-1 -ml-1 active:opacity-60">
          <Feather name="chevron-left" size={26} color="#B2ACC0" />
        </Pressable>
        <View className="flex-1">
          <Text className="text-text-primary" style={{ ...headingShadow, fontSize: 32 }}>
            Barista
          </Text>
          <Text className="text-text-muted text-sm mt-0.5">
            The point isn’t the drink — it’s the pour, the hold, the sip. Hands and time, no alcohol.
          </Text>
        </View>
      </View>

      <FlatList
        data={RECIPES}
        keyExtractor={(it) => it.id}
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => <RecipeCard item={item} i={index} />}
      />
    </SafeArea>
  );
}
