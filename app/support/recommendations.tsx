import React from 'react';
import { View, Text, ScrollView, Pressable, Linking } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { ZoneGlow } from '@/components/ui/ZoneGlow';
import { headingShadow } from '@/styles';

const PLUM = '#A082BE';

// Alcohol-free (0.0 / 0.5) alternatives, UK-available. For the "bridge" phase:
// when you're not fully sober yet and the craving is for a *specific* drink, a
// zero version of that exact thing can take the edge off. Where there's a note
// or a link, it's a tap-through to find/buy it — merged in from the old /swaps
// page so this is the one place for it.
type Swap = { name: string; note?: string; url?: string };

const CATEGORIES: ReadonlyArray<{ heading: string; items: Swap[] }> = [
  {
    heading: 'Lager & Pilsner',
    items: [
      { name: 'Lucky Saint', note: 'Unfiltered lager — the one people can’t tell apart.', url: 'https://luckysaint.co' },
      { name: 'Heineken 0.0', note: 'In almost every pub and shop.', url: 'https://www.heineken.com/gb/en/heineken-00' },
      { name: "Beck's Blue", note: 'The classic 0.0 pilsner. Everywhere, cheap.', url: 'https://www.becks.de/' },
      { name: 'Days Lager', note: 'UK brewery that only makes alcohol-free.', url: 'https://daysbrewing.com' },
      { name: 'Peroni 0.0' },
      { name: 'Estrella Galicia 0.0' },
      { name: 'Corona Cero' },
      { name: 'Erdinger Alkoholfrei' },
    ],
  },
  {
    heading: 'Stout, Ale & Bitter',
    items: [
      { name: 'Guinness 0.0', note: 'Genuinely tastes like Guinness. Widely stocked.', url: 'https://www.guinness.com/en-gb/our-beers/guinness-0-0' },
      { name: 'Big Drop Paradiso', note: 'Craft, without the morning after.', url: 'https://uk.bigdropbrew.com' },
      { name: 'Doom Bar Zero' },
      { name: 'Adnams Ghost Ship 0.5' },
      { name: 'BrewDog Nanny State' },
    ],
  },
  {
    heading: 'IPA & Pale',
    items: [
      { name: 'BrewDog Punk AF' },
      { name: 'Lucky Saint Hazy IPA' },
      { name: 'Big Drop Pine Trail' },
      { name: 'Days Pale Ale' },
    ],
  },
  {
    heading: 'Spirits & mixers',
    items: [
      { name: 'Seedlip', note: 'The original distilled non-alcoholic spirit. With tonic.', url: 'https://www.seedlipdrinks.com' },
      { name: "Lyre's", note: 'Alcohol-free versions of nearly every spirit.', url: 'https://lyres.co.uk' },
      { name: 'CleanCo', note: 'Clean g(in) and tonic, without the gin part.', url: 'https://clean.co' },
    ],
  },
  {
    heading: 'Cider',
    items: [
      { name: 'Old Mout Alcohol-Free' },
      { name: 'Kopparberg 0.0' },
      { name: 'Thatchers Zero' },
      { name: "Sheppy's Low Alcohol" },
    ],
  },
  {
    heading: 'Wine & Fizz',
    items: [
      { name: 'Torres Natureo', note: 'De-alcoholised wine that still tastes like wine.', url: 'https://www.torres.es/en/wines/natureo' },
      { name: 'Nozeco', note: 'Alcohol-free fizz for toasts.', url: 'https://nozeco.com' },
      { name: 'Eisberg' },
      { name: 'Freixenet 0.0' },
      { name: 'McGuigan Zero' },
    ],
  },
];

function Row({ item }: { item: Swap }) {
  const open = () => {
    if (!item.url) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(item.url).catch(() => {});
  };
  return (
    <Pressable
      onPress={open}
      disabled={!item.url}
      className={item.url ? 'active:opacity-70' : undefined}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 14,
        backgroundColor: 'rgba(20,18,24,0.7)',
        borderWidth: 1,
        borderColor: 'rgba(236,233,241,0.1)',
      }}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: 'PatrickHand', fontSize: 19, lineHeight: 23, color: '#ECE9F1' }}>{item.name}</Text>
        {item.note ? (
          <Text style={{ color: '#817B91', fontSize: 12, lineHeight: 16, marginTop: 1 }}>{item.note}</Text>
        ) : null}
      </View>
      {item.url ? <Feather name="external-link" size={15} color={PLUM} /> : null}
    </Pressable>
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
          particular drink. A 0.0 version of the exact thing can take the edge off. Same ritual, same glass,
          zero alcohol. Tap one with a link to find it.
        </Text>
        <Text className="text-text-muted text-xs leading-relaxed mb-6 px-1">
          If an alcohol-free version feels like a trigger for you rather than a help, skip it — that&apos;s
          just as valid. You know your own line.
        </Text>

        {CATEGORIES.map((cat, i) => (
          <Animated.View key={cat.heading} entering={FadeInDown.duration(360).delay(80 + i * 60)} style={{ marginBottom: 22 }}>
            <Text className="text-xs font-semibold tracking-widest uppercase" style={{ color: PLUM, marginBottom: 10 }}>
              {cat.heading}
            </Text>
            <View style={{ gap: 8 }}>
              {cat.items.map((d) => (
                <Row key={d.name} item={d} />
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
