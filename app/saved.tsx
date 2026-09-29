import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { headingShadow } from '@/styles';

const PLUM = '#A082BE';

// The kinds of thing that will be savable — shown as the empty-state promise
// until the save system is wired. Keeping it here documents the intent.
const KINDS: ReadonlyArray<{ icon: keyof typeof Feather.glyphMap; label: string }> = [
  { icon: 'book-open', label: 'Articles from the Reading Corner' },
  { icon: 'cpu', label: 'Games from the Arcade' },
  { icon: 'image', label: 'Moments & community posts' },
  { icon: 'coffee', label: 'Drinks & recommendations' },
];

/**
 * Saved — the bedside drawer in the Me room. A personal stash of favourites so
 * you never have to leave your room to reach the thing that helps: favourite a
 * game, an article, a moment, a drink anywhere in the app and it gathers here.
 *
 * NOTE: this is the shell. The save/favourite system (a toggle on each savable
 * item + a store, then real rows here) is the next feature — see docs/roadmap.md.
 */
export default function SavedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: '#201D28', paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <Animated.View entering={FadeIn.duration(300)} className="flex-row items-center gap-4 px-6 pt-4 pb-1">
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={{ color: '#817B91', fontSize: 18 }}>←</Text>
        </Pressable>
        <Text className="text-text-primary text-2xl font-semibold tracking-tight" style={headingShadow}>
          Saved
        </Text>
      </Animated.View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 12, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <Text className="text-text-secondary text-base leading-relaxed mb-2">
          Your drawer. Everything you keep gathers here — so the thing that helps is
          always one tap away, without leaving your room.
        </Text>
        <Text className="text-text-muted text-sm leading-relaxed mb-8">
          Favourite anything as you go, and find it waiting here later.
        </Text>

        <View style={{ gap: 12 }}>
          {KINDS.map((k, i) => (
            <Animated.View
              key={k.label}
              entering={FadeInDown.duration(360).delay(120 + i * 70)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: 'rgba(20,18,24,0.6)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(236,233,241,0.1)', paddingHorizontal: 16, paddingVertical: 14 }}
            >
              <View style={{ width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(160,130,190,0.16)' }}>
                <Feather name={k.icon} size={18} color={PLUM} />
              </View>
              <Text className="flex-1 text-text-secondary text-sm">{k.label}</Text>
            </Animated.View>
          ))}
        </View>

        <Text className="text-text-muted text-xs leading-relaxed mt-8 text-center">
          Nothing saved yet — start favouriting and your drawer fills up.
        </Text>
      </ScrollView>
    </View>
  );
}
