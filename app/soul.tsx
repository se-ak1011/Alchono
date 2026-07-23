import React from 'react';
import { View, Text, Pressable, FlatList } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { SafeArea } from '@/components/ui/SafeArea';
import { useGoodNews, type GoodNewsItem } from '@/hooks/useGoodNews';
import { headingShadow } from '@/styles';

// Food for the Soul's warm gold — its own quiet identity.
const GOLD = '#C7B58A';

function SoulWash() {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 360 }}>
      <LinearGradient
        colors={['rgba(199,181,138,0.20)', 'rgba(199,181,138,0.07)', 'rgba(32,29,40,0)']}
        locations={[0, 0.45, 1]}
        style={{ flex: 1 }}
      />
    </View>
  );
}

function StoryCard({ item, i }: { item: GoodNewsItem; i: number }) {
  return (
    <Animated.View entering={FadeInDown.duration(320).delay(Math.min(i * 45, 360))}>
      <View className="bg-surface rounded-3xl px-5 py-5 mb-3 border border-white/8">
        <Text className="text-text-primary text-lg font-semibold leading-snug">
          {item.title}
        </Text>
        {/* Complete — never truncated. Everything the reader needs, in-app. */}
        <Text className="text-text-secondary text-base leading-relaxed mt-2.5">
          {item.summary}
        </Text>
        {item.source ? (
          <View
            style={{
              alignSelf: 'flex-start',
              marginTop: 14,
              borderRadius: 20,
              paddingHorizontal: 12,
              paddingVertical: 5,
              backgroundColor: 'rgba(199,181,138,0.14)',
              borderWidth: 1,
              borderColor: 'rgba(199,181,138,0.34)',
            }}
          >
            <Text style={{ color: GOLD, fontSize: 12, fontFamily: 'Inter_600SemiBold' }}>
              {item.source}
            </Text>
          </View>
        ) : null}
      </View>
    </Animated.View>
  );
}

export default function SoulScreen() {
  const router = useRouter();
  const { data: items = [], isLoading } = useGoodNews();

  return (
    <SafeArea>
      <SoulWash />
      <View className="px-6 pt-4 pb-2 flex-row items-center gap-3">
        <Pressable onPress={() => router.back()} hitSlop={12} className="p-1 -ml-1 active:opacity-60">
          <Feather name="chevron-left" size={26} color="#B2ACC0" />
        </Pressable>
        <View className="flex-1">
          <Text className="text-text-primary" style={{ ...headingShadow, fontSize: 32 }}>
            Food for the Soul
          </Text>
          <Text className="text-text-muted text-sm mt-0.5">
            A few minutes of the world being kind.
          </Text>
        </View>
      </View>

      <FlatList
        data={items}
        keyExtractor={(it, i) => `${it.title}-${i}`}
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => <StoryCard item={item} i={index} />}
        ListEmptyComponent={
          !isLoading ? (
            <Text className="text-text-muted text-base text-center leading-relaxed mt-20 px-8">
              Nothing to show right now — check back in a little while.
            </Text>
          ) : null
        }
      />
    </SafeArea>
  );
}
