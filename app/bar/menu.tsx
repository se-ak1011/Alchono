import React from 'react';
import { View, Pressable, ImageBackground, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

/**
 * The mocktails card — the whole 0.0 mocktails menu on one readable card. The
 * recipes are simple enough to list inline (there's no real "recipe" for honey
 * in your tea), so there are no per-drink screens: the preview on the kitchen
 * counter and this close-up are the same card. Tap back to the kitchen.
 */
const mocktails = require('../../assets/folder/mocktails-menu.png');

export default function BarMenu() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();

  return (
    <View style={{ flex: 1, backgroundColor: '#fbfbfa' }}>
      <ImageBackground source={mocktails} style={{ width, height }} resizeMode="contain" />
      <Pressable
        onPress={() => router.back()}
        hitSlop={12}
        style={{ position: 'absolute', top: 52, left: 16, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(58,47,40,0.12)', borderWidth: 1, borderColor: 'rgba(58,47,40,0.18)' }}
      >
        <Feather name="chevron-left" size={24} color="#3a2f28" />
      </Pressable>
    </View>
  );
}
