import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { FOOD_LIST, type FoodSection } from '@/lib/food';

/**
 * The three "Food for the ..." cards — Home's calm footer. Equal thirds, each
 * washed in its own colour, its name in the app's hand. No previews, no
 * clutter — press and you're in the feed.
 */
export function FoodCards({ top }: { top: number }) {
  const router = useRouter();

  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top,
        flexDirection: 'row',
        gap: 8,
        paddingHorizontal: 14,
        paddingTop: 8,
        paddingBottom: 10,
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
          position: 'absolute',
          top: 27,
          left: 0,
          right: 0,
          color: '#817B91',
          fontSize: 8,
          letterSpacing: 1.25,
          fontFamily: 'Inter_600SemiBold',
          textAlign: 'center',
        }}
      >
        FOOD FOR
      </Text>
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 14,
          height: 38,
          alignItems: 'center',
          justifyContent: 'flex-end',
        }}
      >
        <Text
          style={{
            color: section.accent,
            fontFamily: 'SkinnyCustard',
            fontSize: 22,
            // SkinnyCustard's capital T rises above its reported font bounds.
            // Give the one-line Thought label enough leading so its top renders.
            lineHeight: section.key === 'thought' ? 32 : 27,
            textAlign: 'center',
            paddingHorizontal: 2,
            paddingTop: section.key === 'thought' ? 5 : 1,
          }}
          numberOfLines={2}
        >
          {section.lead}
        </Text>
      </View>
    </Pressable>
  );
}
