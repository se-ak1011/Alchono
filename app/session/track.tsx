import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { PaperBackground } from '@/components/ui/PaperBackground';
import { PaperCanvas, Placeable } from '@/components/paper/PaperCanvas';
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
      <PaperCanvas label="Tonight">
        <View style={{ flex: 1, paddingTop: insets.top }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 22, paddingTop: 8 }}>
            <Pressable onPress={() => router.back()} hitSlop={12} className="active:opacity-60">
              <Feather name="chevron-left" size={26} color={INK} />
            </Pressable>
            <Placeable id="title" def={{ dx: 0.226, dy: 0.029 }}>
              <Text style={{ fontFamily: 'PatrickHand', fontSize: 34, color: INK }}>Tonight</Text>
            </Placeable>
          </View>
          <Placeable id="subtitle" def={{ dx: 0.184, dy: 0.028 }}>
            <Text style={{ color: INK_SOFT, fontSize: 14, paddingHorizontal: 24, marginTop: 1 }}>
              Awareness, not judgement.
            </Text>
          </Placeable>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 + insets.bottom }}>
            <Placeable id="today" def={{ dx: 0.061, dy: 0.015, scale: 0.9 }}>
              <DrinkingSession />
            </Placeable>
          </ScrollView>
        </View>
      </PaperCanvas>
    </PaperBackground>
  );
}
