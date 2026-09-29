import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { PaperBackground } from '@/components/ui/PaperBackground';
import { DrinkingSession } from '@/components/home/DrinkingSession';

const INK = '#332a24';
const INK_SOFT = 'rgba(51,42,36,0.55)';

/**
 * "Tonight" — day-to-day drink awareness (the alcohol-free marker, starting /
 * managing a session, live harm-reduction nudges), written on the notebook
 * page like the other quiet screens. When a session is live the tracker's card
 * stays deliberately dark — the one stark object on the page.
 */
export default function TrackScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <PaperBackground>
      <View style={{ flex: 1, paddingTop: insets.top }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 22, paddingTop: 8 }}>
          <Pressable onPress={() => router.back()} hitSlop={12} className="active:opacity-60">
            <Feather name="chevron-left" size={26} color={INK} />
          </Pressable>
          <Text style={{ fontFamily: 'PatrickHand', fontSize: 34, color: INK }}>Tonight</Text>
        </View>
        <Text style={{ color: INK_SOFT, fontSize: 14, paddingHorizontal: 24, marginTop: 1 }}>
          Awareness, not judgement.
        </Text>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 + insets.bottom }}>
          <DrinkingSession />
        </ScrollView>
      </View>
    </PaperBackground>
  );
}
