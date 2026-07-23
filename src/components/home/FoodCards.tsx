import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { FOOD_LIST, type FoodSection } from '@/lib/food';

/**
 * The three "Food for the ..." cards — Home's calm footer. Equal thirds, each
 * washed in its own colour, its name in the app's hand. No previews, no
 * clutter — press and you're in the feed.
 */
export function FoodCards() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        flexDirection: 'row',
        gap: 8,
        paddingHorizontal: 14,
        paddingTop: 8,
        paddingBottom: insets.bottom + 10,
      }}
    >
      {FOOD_LIST.map((section) => (
        <FoodCard
          key={section.key}
          section={section}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push(section.route as any);
          }}
        />
      ))}
    </View>
  );
}

function FoodCard({ section, onPress }: { section: FoodSection; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="active:opacity-80"
      style={{
        flex: 1,
        minHeight: 92,
        borderRadius: 18,
        paddingHorizontal: 8,
        paddingTop: 13,
        paddingBottom: 11,
        backgroundColor: section.tint,
        borderWidth: 1,
        borderColor: section.edge,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          color: '#817B91',
          fontSize: 8,
          letterSpacing: 1.25,
          fontFamily: 'Inter_600SemiBold',
          marginBottom: 3,
        }}
      >
        FOOD FOR
      </Text>
      <Text
        style={{
          color: section.accent,
          fontFamily: 'SkinnyCustard',
          fontSize: 22,
          lineHeight: 27,
          textAlign: 'center',
          paddingHorizontal: 2,
          paddingTop: 1,
        }}
        numberOfLines={2}
      >
        {section.lead}
      </Text>
    </Pressable>
  );
}
