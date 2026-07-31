import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, Image, Dimensions, type ImageSourcePropType } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { useCompanion } from '@/hooks/useCompanion';

const ACCENT = '#E0B080';

// One bar illustration per companion — same room, their face behind the counter
// (853 x 1844, ~phone aspect). The composition is identical, so the drink-name
// positions below work for all of them.
const BAR_SCENES: Record<string, ImageSourcePropType> = {
  kai: require('../assets/scenes/kai_bar.png'),
  amara: require('../assets/scenes/amara_bar.png'),
  amos: require('../assets/scenes/amos_bar.png'),
  rose: require('../assets/scenes/rose_bar.png'),
  yara: require('../assets/scenes/yara_bar.png'),
  marco: require('../assets/scenes/marco_bar.png'),
};

// Size the scene explicitly from screen width (aspectRatio wasn't holding on
// device — the image rendered zoomed). At ~phone aspect this ≈ screen height.
const SCREEN_W = Dimensions.get('window').width;
const IMG_H = SCREEN_W * (1844 / 853);

function rgba(hex: string, a: number): string {
  const h = hex.replace('#', '');
  return `rgba(${parseInt(h.slice(0, 2), 16)}, ${parseInt(h.slice(2, 4), 16)}, ${parseInt(h.slice(4, 6), 16)}, ${a})`;
}

/**
 * The Bar — a full-page illustration you step into. Kai pours behind his own
 * bar; the drink names are hand-lettered onto the counter like a menu, each a
 * link to its recipe. Deliberately dim: a real bar is built to keep you there,
 * this one just holds the ritual and lets you leave.
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

function RecipeSheet({ recipe, onClose }: { recipe: Recipe; onClose: () => void }) {
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

function DrinkLink({ recipe, onPress }: { recipe: Recipe; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={10} style={{ width: '46%', paddingVertical: 6 }} accessibilityRole="button" accessibilityLabel={`${recipe.name}, recipe`}>
      <Text
        style={{
          fontFamily: 'SkinnyCustard',
          fontSize: 23,
          lineHeight: 30,
          color: '#EDE6D8',
          textAlign: 'center',
          textShadowColor: 'rgba(0,0,0,0.9)',
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 6,
        }}
      >
        {recipe.name}
      </Text>
    </Pressable>
  );
}

export default function BaristaScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { companion } = useCompanion();
  const scene = BAR_SCENES[companion.id] ?? BAR_SCENES.kai;
  const [selected, setSelected] = useState<Recipe | null>(null);

  const open = (r: Recipe) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelected(r);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0d0b12' }}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        <View style={{ width: SCREEN_W, height: IMG_H, position: 'relative' }}>
          <Image source={scene} style={{ width: SCREEN_W, height: IMG_H }} resizeMode="cover" />

          {/* Drink names hand-lettered onto the counter — each a link to its recipe. */}
          <View style={{ position: 'absolute', top: IMG_H * 0.66, left: 0, right: 0, paddingHorizontal: 26 }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 20 }}>
              {RECIPES.map((r) => (
                <DrinkLink key={r.id} recipe={r} onPress={() => open(r)} />
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Fixed back arrow over the scene. */}
      <Pressable
        onPress={() => router.back()}
        hitSlop={12}
        style={{ position: 'absolute', top: insets.top + 6, left: 14, padding: 6 }}
        className="active:opacity-60"
      >
        <Feather name="chevron-left" size={28} color="#ECE9F1" />
      </Pressable>

      {selected ? <RecipeSheet recipe={selected} onClose={() => setSelected(null)} /> : null}
    </View>
  );
}
