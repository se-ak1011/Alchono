import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { RecipeSheet } from '@/components/bar/RecipeSheet';
import { getRecipe } from '@/data/recipes';

/**
 * A single drink's recipe as a popup over the Café-Bar. Reached from a drink
 * name on the bar board (/recipe/<id>); presented as a transparent modal so the
 * bar shows through behind the sheet.
 */
export default function RecipePopup() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const recipe = getRecipe(id);
  const close = () => router.back();

  if (!recipe) {
    return (
      <Pressable onPress={close} style={{ flex: 1, backgroundColor: 'rgba(8,6,11,0.6)', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#ECE9F1', fontFamily: 'PatrickHand', fontSize: 18 }}>Recipe not found</Text>
      </Pressable>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <RecipeSheet recipe={recipe} onClose={close} />
    </View>
  );
}
