import React, { useEffect, useState } from 'react';
import { AccessibilityInfo, Pressable, ScrollView, Text, View, type ViewStyle } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ZoneGlow } from '@/components/ui/ZoneGlow';
import { CompanionArt } from '@/components/ui/CompanionArt';
import { useCompanion } from '@/hooks/useCompanion';
import { headingShadow } from '@/styles';

type GameId = 'memory' | 'pattern' | 'odd' | 'colour' | 'word';

const GAMES: ReadonlyArray<{
  id: GameId;
  route: string;
  name: string;
  duration: string;
  // Where this game sits around the player. Edge-anchored so it holds across
  // phone widths; the companion is centred between them.
  place: ViewStyle;
}> = [
  { id: 'memory', route: '/session/memory-match', name: 'Memory\nMatch', duration: '≈3 min', place: { left: 6, top: 8 } },
  { id: 'pattern', route: '/session/simon', name: 'Pattern', duration: '≈2 min', place: { right: 6, top: 22 } },
  { id: 'odd', route: '/session/odd-one-out', name: 'Odd One\nOut', duration: '≈2 min', place: { left: 2, top: 322 } },
  { id: 'colour', route: '/session/stroop', name: 'Colour\nMatch', duration: '≈3 min', place: { right: 4, top: 334 } },
  { id: 'word', route: '/session/word-search', name: 'Word Search', duration: '≈4 min', place: { left: 0, right: 0, top: 452, alignItems: 'center' } },
];

const ivory = '#ECE9F1';
const violet = '#A489DE';

function useReduceMotion() {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReduceMotion(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return reduceMotion;
}

// Compact, static "which game is this" thumbnails — the arcade's real previews
// shrunk to a glance. The animated star of the page is the companion, so these
// stay quiet and legible.
function MiniPreview({ id }: { id: GameId }) {
  switch (id) {
    case 'memory':
      return (
        <View style={{ flexDirection: 'row', gap: 3 }}>
          {[true, false, true].map((up, i) => (
            <View key={i} style={{ width: 9, height: 13, borderRadius: 3, backgroundColor: up ? 'rgba(141,122,174,0.32)' : '#26232b', borderWidth: 1, borderColor: up ? 'rgba(190,177,214,0.42)' : 'rgba(255,255,255,0.08)' }} />
          ))}
        </View>
      );
    case 'pattern':
      return (
        <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center' }}>
          {[false, true, false].map((on, i) => (
            <View key={i} style={{ width: on ? 12 : 9, height: on ? 12 : 9, borderRadius: 6, backgroundColor: on ? 'rgba(141,122,174,0.5)' : 'rgba(244,241,237,0.10)', borderWidth: 1, borderColor: on ? 'rgba(190,177,214,0.5)' : 'rgba(255,255,255,0.1)' }} />
          ))}
        </View>
      );
    case 'odd':
      return (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', width: 30, gap: 3, justifyContent: 'center' }}>
          {Array.from({ length: 9 }).map((_, i) => (
            <View key={i} style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: i === 4 ? 'rgba(190,177,214,0.55)' : 'rgba(244,241,237,0.12)' }} />
          ))}
        </View>
      );
    case 'colour':
      return (
        <View style={{ alignItems: 'center' }}>
          {([['GRN', violet], ['BLU', ivory], ['RED', '#7D97B8']] as const).map(([w, c]) => (
            <Text key={w} style={{ color: c, fontSize: 8, fontWeight: '800', letterSpacing: 0.5, lineHeight: 10 }}>{w}</Text>
          ))}
        </View>
      );
    case 'word':
      return (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', width: 30, justifyContent: 'center' }}>
          {['C', 'A', 'L', 'E', 'R', 'A', 'H', 'O', 'P'].map((ch, i) => (
            <Text key={i} style={{ width: 10, textAlign: 'center', fontSize: 8, lineHeight: 11, fontWeight: '800', color: i < 3 ? ivory : '#6a6478' }}>{ch}</Text>
          ))}
        </View>
      );
  }
}

export default function GamesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();
  const { pose } = useCompanion();
  const { from } = useLocalSearchParams<{ from?: string }>();
  // Games opened during an urge carry the context through, so finishing
  // asks "did it pass?". Opened casually, they're just games.
  const suffix = from === 'urge' ? '?from=urge' : '';

  const openGame = async (route: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push((route + suffix) as any);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#201D28', paddingTop: insets.top }}>
      <ZoneGlow zone="games" intensity={1.5} />
      <Animated.View entering={FadeIn.duration(300)} style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button" accessibilityLabel="Go back">
            <Text style={{ color: '#817B91', fontSize: 18 }}>←</Text>
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 34, ...headingShadow }}>Games Arcade</Text>
            <Text style={{ color: '#817B91', fontSize: 15, marginTop: 2, lineHeight: 21 }}>
              Something else to hold onto.
            </Text>
          </View>
        </View>
      </Animated.View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* The play stage. Your companion is already here, deep in a game, and
            the others are strewn around them like pieces on the floor. You've
            walked into the arcade looking for your friend — tap one to join. */}
        <View style={{ height: 588, position: 'relative' }}>
          {/* Soft light pooled where the companion sits. */}
          <View
            pointerEvents="none"
            style={{ position: 'absolute', left: 0, right: 0, top: 268, alignItems: 'center' }}
          >
            <View style={{ width: 226, height: 62, borderRadius: 31, backgroundColor: 'rgba(164,137,222,0.10)' }} />
          </View>

          <Animated.View
            entering={reduceMotion ? undefined : FadeIn.duration(500).delay(120)}
            style={{ position: 'absolute', left: 0, right: 0, top: 108, alignItems: 'center' }}
            pointerEvents="none"
          >
            <CompanionArt source={pose('playing')} width={190} height={234} />
          </Animated.View>

          {GAMES.map((game, index) => (
            <Animated.View
              key={game.id}
              entering={reduceMotion ? undefined : FadeInDown.duration(360).delay(180 + index * 70)}
              style={{ position: 'absolute', ...game.place }}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${game.name.replace('\n', ' ')}. ${game.duration}`}
                onPress={() => openGame(game.route)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 9,
                  paddingVertical: 8,
                  paddingLeft: 8,
                  paddingRight: 13,
                  borderRadius: 18,
                  backgroundColor: 'rgba(24,21,30,0.92)',
                  borderWidth: 1,
                  borderColor: 'rgba(236,233,241,0.13)',
                  shadowColor: '#000',
                  shadowOpacity: 0.34,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 6 },
                  elevation: 6,
                }}
              >
                <View
                  style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: '#111214', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                >
                  <MiniPreview id={game.id} />
                </View>
                <View>
                  <Text style={{ color: ivory, fontFamily: 'SkinnyCustard', fontSize: 20, lineHeight: 21 }}>{game.name}</Text>
                  <Text style={{ color: violet, fontSize: 11.5, fontFamily: 'Inter_600SemiBold', marginTop: 2 }}>{game.duration}</Text>
                </View>
              </Pressable>
            </Animated.View>
          ))}

          <View style={{ position: 'absolute', left: 0, right: 0, top: 548, alignItems: 'center' }} pointerEvents="none">
            <Text style={{ color: '#6a6478', fontSize: 13, fontFamily: 'SkinnyCustard', letterSpacing: 0.5 }}>tap a game to join</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
