import React from 'react';
import { View, Text, Pressable, ScrollView, Platform } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { CompanionArt } from '@/components/ui/CompanionArt';
import { useCompanion } from '@/hooks/useCompanion';
import { headingShadow } from '@/styles';

const MONO = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }) as string;

/**
 * The Caff — one warm room that holds the three "Food for…" reads, like papers
 * left on a café table. You pull up a chair with the companion and pick one up:
 * the good-news gazette, the funny pages, or the letters column. Keeps them
 * feeling finite (a paper you read and put down), never an endless feed.
 */
type Paper = {
  route: string;
  masthead: string;
  kicker: string;
  teaser: string;
  paper: string; // cover tint
  ink: string; // heading colour
  rotate: number;
  render: 'gazette' | 'funnies' | 'letters';
};

const PAPERS: Paper[] = [
  {
    route: '/soul',
    masthead: 'The Good News Gazette',
    kicker: 'THE WORLD, BEING KIND',
    teaser: 'A few minutes of the good stuff — the bits of the paper that don’t hurt.',
    paper: '#e7e1d2',
    ink: '#2b2620',
    rotate: -1.1,
    render: 'gazette',
  },
  {
    route: '/giggles',
    masthead: 'The Funny Pages',
    kicker: 'NOT TAKING IT ALL SO SERIOUSLY',
    teaser: 'Small, daft, true-ish stories. Cut out and keep.',
    paper: '#e9dfe4',
    ink: '#33262e',
    rotate: 1.3,
    render: 'funnies',
  },
  {
    route: '/thought',
    masthead: 'The Letters Page',
    kicker: 'SOMEONE’S IN THE WRONG',
    teaser: 'Read the dilemma, cast your verdict, then see how everyone else saw it.',
    paper: '#d8e0dd',
    ink: '#24302c',
    rotate: -0.8,
    render: 'letters',
  },
];

function PaperCard({ p, onPress }: { p: Paper; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className="active:opacity-90" style={{ marginBottom: 20, transform: [{ rotate: `${p.rotate}deg` }] }}>
      <View
        style={{
          backgroundColor: p.paper,
          borderRadius: 4,
          paddingHorizontal: 18,
          paddingTop: 14,
          paddingBottom: 16,
          shadowColor: '#000',
          shadowOpacity: 0.5,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 7 },
          elevation: 6,
        }}
      >
        {/* Kicker + masthead — newspaper chrome */}
        <Text style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: 2, color: 'rgba(0,0,0,0.5)' }}>{p.kicker}</Text>
        <View style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.25)', marginVertical: 6 }} />
        <Text style={{ fontSize: 25, lineHeight: 28, color: p.ink, fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }), fontWeight: '700' }}>
          {p.masthead}
        </Text>
        <View style={{ height: 2, backgroundColor: 'rgba(0,0,0,0.35)', marginTop: 8, marginBottom: 10 }} />

        {p.render === 'gazette' ? (
          <Text style={{ fontSize: 13.5, lineHeight: 19, color: 'rgba(0,0,0,0.72)' }}>{p.teaser}</Text>
        ) : p.render === 'funnies' ? (
          <Text style={{ fontSize: 14, lineHeight: 20, color: 'rgba(0,0,0,0.72)', fontStyle: 'italic' }}>{p.teaser}</Text>
        ) : (
          <Text style={{ fontSize: 13.5, lineHeight: 19, color: 'rgba(0,0,0,0.72)' }}>
            <Text style={{ fontStyle: 'italic' }}>Dear reader — </Text>{p.teaser}
          </Text>
        )}

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 12 }}>
          <Text style={{ fontFamily: MONO, fontSize: 11, color: 'rgba(0,0,0,0.6)', letterSpacing: 0.5 }}>read it</Text>
          <Feather name="arrow-right" size={14} color="rgba(0,0,0,0.6)" />
        </View>
      </View>
    </Pressable>
  );
}

export default function CaffScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { pose } = useCompanion();

  const open = (route: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(route as any);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#201D28', paddingTop: insets.top, paddingBottom: insets.bottom }}>
      {/* Warm café light from the top. */}
      <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 380 }}>
        <LinearGradient colors={['rgba(224,176,128,0.16)', 'rgba(224,176,128,0.05)', 'rgba(32,29,40,0)']} locations={[0, 0.5, 1]} style={{ flex: 1 }} />
      </View>

      <Animated.View entering={FadeIn.duration(300)} className="flex-row items-center gap-3 px-6 pt-4 pb-1">
        <Pressable onPress={() => router.back()} hitSlop={12} className="p-1 -ml-1 active:opacity-60">
          <Feather name="chevron-left" size={26} color="#B2ACC0" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ ...headingShadow, fontSize: 34 }}>The Caff</Text>
          <Text style={{ color: '#817B91', fontSize: 15, marginTop: 2 }}>Pull up a chair. Pick up a paper.</Text>
        </View>
      </Animated.View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40, paddingTop: 4 }} showsVerticalScrollIndicator={false}>
        {/* Companion at the table with a brew. */}
        <View className="items-center" style={{ marginTop: 4, marginBottom: 10 }} pointerEvents="none">
          <CompanionArt source={pose('tea')} width={190} height={232} />
        </View>

        {PAPERS.map((p, i) => (
          <Animated.View key={p.route} entering={FadeInDown.duration(360).delay(120 + i * 90)}>
            <PaperCard p={p} onPress={() => open(p.route)} />
          </Animated.View>
        ))}
      </ScrollView>
    </View>
  );
}
