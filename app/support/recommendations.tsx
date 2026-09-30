import React from 'react';
import { View, Text, ScrollView, Pressable, Linking } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { ZoneGlow } from '@/components/ui/ZoneGlow';
import { headingShadow } from '@/styles';
import { SWAP_CATEGORIES, type Swap } from '@/data/swaps';

const PLUM = '#A082BE';

// 0.0 / 0.5 alternatives now live in one shared place (src/data/swaps.ts),
// so the Recommendations screen and the corkboard preview stay in sync.
const CATEGORIES = SWAP_CATEGORIES;

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
