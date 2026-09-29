import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, Image, Dimensions, type ImageSourcePropType } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { useCompanion } from '@/hooks/useCompanion';
import { RECIPES, type Recipe } from '@/data/recipes';
import { RecipeSheet } from '@/components/bar/RecipeSheet';

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

/**
 * The Bar — a full-page illustration you step into. The drink names are
 * hand-lettered onto the counter like a menu, each a link to its recipe.
 * Deliberately dim: a real bar is built to keep you there, this one just holds
 * the ritual and lets you leave. (Recipes + the sheet are shared with the
 * Café-Bar boards via @/data/recipes and @/components/bar/RecipeSheet.)
 */
function DrinkLink({ recipe, onPress }: { recipe: Recipe; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={10} style={{ width: '46%', paddingVertical: 6 }} accessibilityRole="button" accessibilityLabel={`${recipe.name}, recipe`}>
      <Text
        style={{
          fontFamily: 'PatrickHand',
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
