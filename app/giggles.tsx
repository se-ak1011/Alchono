import React from 'react';
import { View, Text, Pressable, FlatList } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { SafeArea } from '@/components/ui/SafeArea';
import { useCuratedStories, type CuratedStory } from '@/hooks/useCuratedStories';
import { FOOD } from '@/lib/food';
import { headingShadow } from '@/styles';

const S = FOOD.giggles;

function Wash() {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 360 }}>
      <LinearGradient
        colors={[S.wash, 'rgba(214,161,132,0.06)', 'rgba(32,29,40,0)']}
        locations={[0, 0.45, 1]}
        style={{ flex: 1 }}
      />
    </View>
  );
}

function Story({ item, i }: { item: CuratedStory; i: number }) {
  return (
    <Animated.View entering={FadeInDown.duration(320).delay(Math.min(i * 45, 360))}>
      <View className="bg-surface rounded-3xl px-5 py-5 mb-3 border border-white/8">
        <Text className="text-text-primary text-lg font-semibold leading-snug">{item.title}</Text>
        <Text className="text-text-secondary text-base leading-relaxed mt-2.5">{item.body}</Text>
      </View>
    </Animated.View>
  );
}

export default function GigglesScreen() {
  const router = useRouter();
  const { data: stories = [], isLoading } = useCuratedStories('giggle');

  return (
    <SafeArea>
      <Wash />
      <View className="px-6 pt-4 pb-2 flex-row items-center gap-3">
        <Pressable onPress={() => router.back()} hitSlop={12} className="p-1 -ml-1 active:opacity-60">
          <Feather name="chevron-left" size={26} color="#B2ACC0" />
        </Pressable>
        <View className="flex-1">
          <Text className="text-text-primary" style={{ ...headingShadow, fontSize: 32 }}>
            {S.title}
          </Text>
          <Text className="text-text-muted text-sm mt-0.5">A few minutes of not taking it all so seriously.</Text>
        </View>
      </View>

      <FlatList
        data={stories}
        keyExtractor={(it) => it.id}
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => <Story item={item} i={index} />}
        ListEmptyComponent={
          !isLoading ? (
            <View className="items-center px-10 mt-24">
              <Text className="text-text-secondary text-base text-center leading-relaxed">
                Fresh giggles are on the way.
              </Text>
              <Text className="text-text-muted text-sm text-center leading-relaxed mt-2">
                Check back in a little while.
              </Text>
            </View>
          ) : null
        }
      />
    </SafeArea>
  );
}
