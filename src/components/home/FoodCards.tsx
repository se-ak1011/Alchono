import React, { useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { FOOD_LIST, type FoodSection } from '@/lib/food';
import { useGoodNews } from '@/hooks/useGoodNews';

/**
 * The three compact "Food for the ..." cards — Home's calm footer. Equal
 * thirds, each its own colour, tapping into its feed. The Soul card carries a
 * live one-line teaser of the latest good news so the warmth still lives on
 * Home; the full summaries live inside the feed. No scroll, no clutter.
 */
export function FoodCards() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: news = [] } = useGoodNews();
  const [teaseIdx, setTeaseIdx] = useState(0);

  useEffect(() => {
    if (news.length < 2) return;
    const t = setInterval(() => setTeaseIdx((i) => (i + 1) % news.length), 6000);
    return () => clearInterval(t);
  }, [news.length]);

  const soulTeaser = news.length
    ? news[teaseIdx % news.length].title
    : FOOD_LIST[0].blurb;

  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        flexDirection: 'row',
        gap: 10,
        paddingHorizontal: 16,
        paddingTop: 4,
        paddingBottom: insets.bottom + 8,
      }}
    >
      {FOOD_LIST.map((section) => (
        <FoodCard
          key={section.key}
          section={section}
          teaser={section.key === 'soul' ? soulTeaser : section.blurb}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push(section.route as any);
          }}
        />
      ))}
    </View>
  );
}

function FoodCard({
  section,
  teaser,
  onPress,
}: {
  section: FoodSection;
  teaser: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="active:opacity-80"
      style={{
        flex: 1,
        minHeight: 116,
        borderRadius: 20,
        paddingHorizontal: 13,
        paddingTop: 12,
        paddingBottom: 12,
        backgroundColor: section.tint,
        borderWidth: 1,
        borderColor: section.edge,
        justifyContent: 'space-between',
      }}
    >
      <View>
        <Text
          style={{
            color: '#817B91',
            fontSize: 9,
            letterSpacing: 1.5,
            fontFamily: 'Inter_600SemiBold',
          }}
        >
          FOOD FOR
        </Text>
        <Text
          style={{
            color: section.accent,
            fontFamily: 'SkinnyCustard',
            fontSize: 22,
            lineHeight: 24,
            marginTop: 2,
          }}
          numberOfLines={2}
        >
          {section.lead}
        </Text>
      </View>
      <Text
        className="text-text-secondary"
        style={{ fontSize: 11, lineHeight: 15, marginTop: 8 }}
        numberOfLines={3}
      >
        {teaser}
      </Text>
    </Pressable>
  );
}
