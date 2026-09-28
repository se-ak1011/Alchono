import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ZoneGlow } from '@/components/ui/ZoneGlow';
import { headingShadow } from '@/styles';

const PLUM = '#A082BE';

// Alcohol-free (0.0 / 0.5) alternatives, UK-available. For the "bridge" phase:
// when you're not fully sober yet and the craving is for a *specific* drink, a
// zero version of that exact thing can take the edge off.
const CATEGORIES: ReadonlyArray<{ heading: string; items: string[] }> = [
  { heading: 'Lager & Pilsner', items: ['Lucky Saint', 'Heineken 0.0', "Beck's Blue", 'Peroni 0.0', 'Estrella Galicia 0.0', 'Corona Cero', 'Erdinger Alkoholfrei'] },
  { heading: 'Stout, Ale & Bitter', items: ['Guinness 0.0', 'Doom Bar Zero', 'Adnams Ghost Ship 0.5', 'BrewDog Nanny State', 'Big Drop Paradiso'] },
  { heading: 'IPA & Pale', items: ['BrewDog Punk AF', 'Lucky Saint Hazy IPA', 'Big Drop Pine Trail', 'Days Pale Ale'] },
  { heading: 'Cider', items: ['Old Mout Alcohol-Free', 'Kopparberg 0.0', 'Thatchers Zero', "Sheppy's Low Alcohol"] },
  { heading: 'Wine & Fizz', items: ['Eisberg', 'Torres Natureo', 'Freixenet 0.0', 'Nozeco', 'McGuigan Zero'] },
];

function Chip({ label }: { label: string }) {
  return (
    <View
      style={{
        minHeight: 36,
        justifyContent: 'center',
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 19,
        backgroundColor: 'rgba(20,18,24,0.9)',
        borderWidth: 1,
        borderColor: 'rgba(236,233,241,0.14)',
      }}
    >
      <Text style={{ fontFamily: 'PatrickHand', fontSize: 18, lineHeight: 22, color: '#ECE9F1' }}>{label}</Text>
    </View>
  );
}

export default function RecommendationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: '#201D28', paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <ZoneGlow zone="support" intensity={0.55} />
      <Animated.View entering={FadeIn.duration(300)} className="flex-row items-center gap-4 px-6 pt-4 pb-1">
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={{ color: '#817B91', fontSize: 18 }}>←</Text>
        </Pressable>
        <Text className="text-text-primary text-2xl font-semibold tracking-tight" style={headingShadow}>
          Recommendations
        </Text>
      </Animated.View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, paddingTop: 8 }} showsVerticalScrollIndicator={false}>
        <Text className="text-text-secondary text-sm leading-relaxed mb-2 px-1">
          Alcohol-free swaps for the bridge — when you&apos;re not fully sober yet and the craving is for a
          particular drink. A 0.0 version of the exact thing can take the edge off.
        </Text>
        <Text className="text-text-muted text-xs leading-relaxed mb-6 px-1">
          If an alcohol-free version feels like a trigger for you rather than a help, skip it — that&apos;s
          just as valid. You know your own line.
        </Text>

        {CATEGORIES.map((cat, i) => (
          <Animated.View key={cat.heading} entering={FadeInDown.duration(360).delay(80 + i * 70)} style={{ marginBottom: 22 }}>
            <Text className="text-xs font-semibold tracking-widest uppercase" style={{ color: PLUM, marginBottom: 10 }}>
              {cat.heading}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {cat.items.map((d) => (
                <Chip key={d} label={d} />
              ))}
            </View>
          </Animated.View>
        ))}

        <Text className="text-text-muted text-xs leading-relaxed mt-2 px-1">
          Not sponsored — just widely-available options. Check the label: &ldquo;0.0%&rdquo; is
          alcohol-free; &ldquo;0.5%&rdquo; is very low but not zero.
        </Text>
      </ScrollView>
    </View>
  );
}
