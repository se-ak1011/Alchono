import React from 'react';
import { View, Text, ScrollView, Pressable, Linking, Alert } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { headingShadow } from '@/styles';

const SWAP_SECTIONS: {
  heading: string;
  items: { name: string; note: string; url: string }[];
}[] = [
  {
    heading: 'Beers (0.0%)',
    items: [
      { name: "Beck's Blue", url: 'https://www.becks.de/', note: 'The classic 0.0 pilsner. Everywhere, cheap.' },
      { name: 'Lucky Saint', url: 'https://luckysaint.co', note: 'Unfiltered lager — the one beer people can’t tell apart.' },
      { name: 'Guinness 0.0', url: 'https://www.guinness.com/en-gb/our-beers/guinness-0-0', note: 'Genuinely tastes like Guinness. Widely stocked.' },
      { name: 'Heineken 0.0', url: 'https://www.heineken.com/gb/en/heineken-00', note: 'Available in almost every pub and shop.' },
      { name: 'Days Lager', url: 'https://daysbrewing.com', note: 'UK brewery that only makes alcohol-free.' },
      { name: 'Big Drop Paradiso', url: 'https://uk.bigdropbrew.com', note: 'Craft citra IPA without the morning after.' },
    ],
  },
  {
    heading: 'Spirits & mixers',
    items: [
      { name: 'Seedlip', url: 'https://www.seedlipdrinks.com', note: 'The original distilled non-alcoholic spirit. With tonic.' },
      { name: "Lyre's", url: 'https://lyres.co.uk', note: 'Alcohol-free versions of nearly every spirit.' },
      { name: 'CleanCo', url: 'https://clean.co', note: 'Clean G(in) and tonic, without the gin part.' },
    ],
  },
  {
    heading: 'Wine & fizz',
    items: [
      { name: 'Nozeco', url: 'https://nozeco.com', note: 'Alcohol-free fizz for toasts and celebrations.' },
      { name: 'Torres Natureo', url: 'https://www.torres.es/en/wines/natureo', note: 'De-alcoholised wine that still tastes like wine.' },
    ],
  },
];

export default function SwapsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#0E0F10',
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }}
    >
      <Animated.View
        entering={FadeIn.duration(300)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 16,
          paddingHorizontal: 24,
          paddingTop: 16,
          paddingBottom: 16,
        }}
      >
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={{ color: '#6B7280', fontSize: 18 }}>←</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: '#F0F2F4',
              fontSize: 26,
              fontFamily: 'Inter_600SemiBold',
              ...headingShadow,
            }}
          >
            Swap it, don't fight it.
          </Text>
          <Text style={{ color: '#6B7280', fontSize: 15, marginTop: 2 }}>
            Same ritual. Same glass. Zero alcohol.
          </Text>
        </View>
      </Animated.View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-text-secondary text-sm leading-relaxed mb-6">
          Sometimes the craving is for the ritual — the crack of the can, the
          glass in hand — more than the alcohol. These scratch that itch. All
          available in most UK supermarkets.
        </Text>

        {SWAP_SECTIONS.map((section, si) => (
          <Animated.View
            key={section.heading}
            entering={FadeInDown.duration(300).delay(si * 60)}
            className="mb-6"
          >
            <Text className="text-text-muted text-sm font-semibold tracking-widest uppercase mb-3">
              {section.heading}
            </Text>
            {section.items.map((item) => (
              <Pressable
                key={item.name}
                onPress={async () => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  try {
                    await Linking.openURL(item.url);
                  } catch {
                    Alert.alert('Could not open', item.url);
                  }
                }}
                className="bg-surface rounded-2xl px-5 py-4 mb-3 border border-white/5 active:border-white/20"
              >
                <View className="flex-row items-center justify-between">
                  <Text className="text-text-primary text-base font-semibold mb-0.5 flex-1 pr-3">
                    {item.name}
                  </Text>
                  <Text className="text-text-muted text-sm">→</Text>
                </View>
                <Text className="text-text-secondary text-sm leading-relaxed">
                  {item.note}
                </Text>
              </Pressable>
            ))}
          </Animated.View>
        ))}

        <Text className="text-text-muted text-sm leading-relaxed mb-4">
          Honest note: for some people, zero-alcohol drinks keep the craving
          alive rather than settling it. If that's you, skip these — water,
          tea, or anything else entirely is the better swap. You know yourself
          best.
        </Text>
        <Text className="text-text-muted text-xs">
          Nothing here is sponsored. Just what works for people.
        </Text>
      </ScrollView>
    </View>
  );
}
