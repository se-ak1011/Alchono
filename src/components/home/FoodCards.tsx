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
        minHeight: 96,
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 14,
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
          fontSize: 9,
          letterSpacing: 1.5,
          fontFamily: 'Inter_600SemiBold',
          marginBottom: 2,
        }}
      >
        FOOD FOR
      </Text>
      <Text
        style={{
          color: section.accent,
          fontFamily: 'SkinnyCustard',
          fontSize: 24,
          lineHeight: 26,
          textAlign: 'center',
        }}
        numberOfLines={2}
      >
        {section.lead}
      </Text>
    </Pressable>
  );
}
