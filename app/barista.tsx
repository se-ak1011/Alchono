import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { SafeArea } from '@/components/ui/SafeArea';
import { CompanionArt } from '@/components/ui/CompanionArt';
import { useCompanion } from '@/hooks/useCompanion';
import { headingShadow } from '@/styles';

const ACCENT = '#E0B080';

function rgba(hex: string, a: number): string {
  const h = hex.replace('#', '');
  return `rgba(${parseInt(h.slice(0, 2), 16)}, ${parseInt(h.slice(2, 4), 16)}, ${parseInt(h.slice(4, 6), 16)}, ${a})`;
}

/**
 * The Bar — the drink ritual without the alcohol. It looks like a bar you'd
 * walk into: juice bottles racked like wine, cans in a lit fridge, a barista
 * behind the counter. Tap a bottle or can for its recipe. Everything is
 * deliberately dim and washed — a bar is designed to keep you there; this one
 * is the opposite. The place replaces the ritual, never the pull.
 */
type Recipe = {
  id: string;
  name: string;
  tagline: string;
  minutes: number;
  need: string[];
  steps: string[];
  vessel: 'bottle' | 'can';
  tint: string; // washed low, a feeling not a colour
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
    vessel: 'bottle',
    tint: '#E0A05A',
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
    vessel: 'bottle',
    tint: '#B5895A',
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
    vessel: 'bottle',
    tint: '#8FB87A',
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
    vessel: 'can',
    tint: '#C9A24A',
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
    vessel: 'can',
    tint: '#C6A87A',
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
    vessel: 'can',
    tint: '#CDBE86',
  },
];

const BOTTLES = RECIPES.filter((r) => r.vessel === 'bottle');
const CANS = RECIPES.filter((r) => r.vessel === 'can');

function Bottle({ recipe, onPress }: { recipe: Recipe; onPress: () => void }) {
  const c = recipe.tint;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${recipe.name}, ${recipe.minutes} minutes`} className="active:opacity-80" style={{ alignItems: 'center', width: 96 }}>
      <View style={{ transform: [{ rotate: '-16deg' }], flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ width: 70, height: 27, borderRadius: 9, backgroundColor: rgba(c, 0.24), borderWidth: 1, borderColor: rgba(c, 0.4), justifyContent: 'center', overflow: 'hidden' }}>
          <View style={{ position: 'absolute', left: 6, top: 5, width: 8, height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.16)' }} />
          <View style={{ marginHorizontal: 14, height: 15, borderRadius: 2, backgroundColor: 'rgba(245,238,225,0.9)', alignItems: 'center', justifyContent: 'center' }}>
            <Text numberOfLines={1} style={{ color: '#3a2a1e', fontSize: 7.5, fontFamily: 'SkinnyCustard' }}>{recipe.name}</Text>
          </View>
        </View>
        <View style={{ width: 16, height: 12, backgroundColor: rgba(c, 0.34), borderTopRightRadius: 4, borderBottomRightRadius: 4, marginLeft: -1 }} />
        <View style={{ width: 4, height: 13, borderRadius: 2, backgroundColor: 'rgba(30,24,18,0.9)', marginLeft: -1 }} />
      </View>
    </Pressable>
  );
}

function Can({ recipe, onPress }: { recipe: Recipe; onPress: () => void }) {
  const c = recipe.tint;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${recipe.name}, ${recipe.minutes} minutes`} className="active:opacity-80 items-center" style={{ width: 78 }}>
      <View style={{ width: 40, height: 62, borderRadius: 7, backgroundColor: rgba(c, 0.22), borderWidth: 1, borderColor: rgba(c, 0.36), overflow: 'hidden' }}>
        <View style={{ position: 'absolute', top: -3, left: 3, right: 3, height: 7, borderRadius: 6, backgroundColor: 'rgba(210,210,214,0.7)' }} />
        <View style={{ position: 'absolute', top: 20, left: 0, right: 0, height: 22, backgroundColor: 'rgba(245,238,225,0.88)', alignItems: 'center', justifyContent: 'center' }}>
          <Text numberOfLines={2} style={{ color: '#3a2a1e', fontSize: 7.5, lineHeight: 8.5, fontFamily: 'SkinnyCustard', textAlign: 'center', paddingHorizontal: 2 }}>{recipe.name}</Text>
        </View>
      </View>
      <Text numberOfLines={1} className="text-text-muted" style={{ fontSize: 10, marginTop: 5, maxWidth: 74, textAlign: 'center' }}>{recipe.minutes} min</Text>
    </Pressable>
  );
}

function RecipeSheet({ recipe, onClose }: { recipe: Recipe; onClose: () => void }) {
  return (
    <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, zIndex: 60 }}>
      <Animated.View entering={FadeIn.duration(160)} style={{ position: 'absolute', inset: 0 }}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(8,6,11,0.6)' }} onPress={onClose} />
      </Animated.View>
      <Animated.View
        entering={FadeInDown.duration(260)}
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, maxHeight: '82%', backgroundColor: '#241f2b', borderTopLeftRadius: 26, borderTopRightRadius: 26, borderWidth: 1, borderColor: 'rgba(236,233,241,0.1)', paddingTop: 10 }}
      >
        <View style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(236,233,241,0.2)', marginBottom: 8 }} />
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
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

export default function BaristaScreen() {
  const router = useRouter();
  const { pose } = useCompanion();
  const [selected, setSelected] = useState<Recipe | null>(null);

  const open = (r: Recipe) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelected(r);
  };

  return (
    <SafeArea>
      <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 320 }}>
        <LinearGradient colors={['rgba(224,176,128,0.14)', 'rgba(224,176,128,0.04)', 'rgba(32,29,40,0)']} locations={[0, 0.5, 1]} style={{ flex: 1 }} />
      </View>

      <View className="px-6 pt-4 pb-1 flex-row items-center gap-3">
        <Pressable onPress={() => router.back()} hitSlop={12} className="p-1 -ml-1 active:opacity-60">
          <Feather name="chevron-left" size={26} color="#B2ACC0" />
        </Pressable>
        <View className="flex-1">
          <Text className="text-text-primary" style={{ ...headingShadow, fontSize: 32 }}>The Bar</Text>
          <Text className="text-text-muted text-sm mt-0.5">
            The point isn’t the drink — it’s the pour, the hold, the sip.
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* On the rack — juice bottles racked like wine. */}
        <View style={{ marginHorizontal: 18, marginTop: 10, height: 150, borderRadius: 10, borderWidth: 2, borderColor: '#3a2a1e', backgroundColor: '#1e150e', overflow: 'hidden', justifyContent: 'center' }}>
          {/* two slats to read as a rack */}
          <View pointerEvents="none" style={{ position: 'absolute', left: -20, right: -20, top: 74, height: 2, backgroundColor: 'rgba(58,42,30,0.9)', transform: [{ rotate: '9deg' }] }} />
          <View pointerEvents="none" style={{ position: 'absolute', left: -20, right: -20, top: 74, height: 2, backgroundColor: 'rgba(58,42,30,0.9)', transform: [{ rotate: '-9deg' }] }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' }}>
            {BOTTLES.map((r) => (
              <Bottle key={r.id} recipe={r} onPress={() => open(r)} />
            ))}
          </View>
        </View>

        {/* Behind the bar — the barista, and the counter. */}
        <View style={{ alignItems: 'center', marginTop: 8 }} pointerEvents="box-none">
          <CompanionArt source={pose('barista')} width={168} height={168} />
        </View>
        <View style={{ height: 14, marginTop: -6, backgroundColor: '#3a2a1e' }}>
          <View style={{ height: 3, backgroundColor: 'rgba(224,176,128,0.22)' }} />
        </View>

        {/* In the fridge — cans on a lit shelf. */}
        <View style={{ marginHorizontal: 18, marginTop: 16, borderRadius: 12, borderWidth: 2, borderColor: '#23303a', overflow: 'hidden' }}>
          <LinearGradient colors={['rgba(120,160,175,0.12)', 'rgba(30,42,50,0.55)']} style={{ padding: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', borderBottomWidth: 3, borderBottomColor: 'rgba(40,55,63,0.9)', paddingBottom: 12 }}>
              {CANS.map((r) => (
                <Can key={r.id} recipe={r} onPress={() => open(r)} />
              ))}
            </View>
          </LinearGradient>
        </View>
      </ScrollView>

      {selected ? <RecipeSheet recipe={selected} onClose={() => setSelected(null)} /> : null}
    </SafeArea>
  );
}
