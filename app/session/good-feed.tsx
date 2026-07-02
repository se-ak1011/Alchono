import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Image,
  Linking,
  FlatList,
  Dimensions,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { useGoodFeed, thumbnailUrl, watchUrl, type GoodFeedItem } from '@/hooks/useGoodFeed';
import { headingShadow } from '@/styles';

const SCREEN_W = Dimensions.get('window').width;
const CARD_MARGIN = 24;

const CATEGORY_LABELS: Record<string, string> = {
  kindness: 'Kindness',
  animals: 'Animals',
  reunions: 'Reunions',
  fails: 'Fails',
  rescues: 'Rescues',
  wholesome: 'Wholesome',
};

type Slide = { kind: 'video'; item: GoodFeedItem } | { kind: 'end' };

export default function GoodFeedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: items, isLoading } = useGoodFeed();
  const [page, setPage] = useState(0);

  const slides: Slide[] = [
    ...(items ?? []).map((item) => ({ kind: 'video' as const, item })),
    { kind: 'end' as const },
  ];
  const videoCount = items?.length ?? 0;

  const renderSlide = ({ item: slide }: { item: Slide }) => {
    if (slide.kind === 'end') {
      return (
        <View
          style={{
            width: SCREEN_W,
            paddingHorizontal: CARD_MARGIN,
            justifyContent: 'center',
          }}
        >
          <View className="bg-surface rounded-3xl px-6 py-12 border border-white/8 items-center">
            <Text className="text-text-primary text-2xl font-semibold mb-3 text-center">
              That's the good stuff.
            </Text>
            <Text className="text-text-secondary text-base mb-8 text-center leading-relaxed">
              Fresh picks tomorrow.{'\n'}How are you feeling?
            </Text>
            <Button
              title="Done"
              variant="primary"
              size="lg"
              fullWidth
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
            />
          </View>
        </View>
      );
    }

    const { item } = slide;
    return (
      <View
        style={{
          width: SCREEN_W,
          paddingHorizontal: CARD_MARGIN,
          justifyContent: 'center',
        }}
      >
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            Linking.openURL(watchUrl(item.youtube_id)).catch(() => {});
          }}
          className="bg-surface rounded-3xl border border-white/8 active:border-white/20 overflow-hidden"
        >
          <Image
            source={{ uri: thumbnailUrl(item.youtube_id) }}
            style={{ width: '100%', aspectRatio: 16 / 9, backgroundColor: '#161718' }}
            resizeMode="cover"
          />
          <View className="px-5 py-5">
            <Text className="text-text-muted text-xs font-semibold tracking-widest uppercase mb-2">
              {CATEGORY_LABELS[item.category] ?? item.category}
            </Text>
            <Text className="text-text-primary text-lg font-semibold leading-snug mb-2">
              {item.title}
            </Text>
            <Text className="text-text-muted text-sm">Tap to play on YouTube →</Text>
          </View>
        </Pressable>
      </View>
    );
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#0E0F10',
        paddingTop: insets.top,
        paddingBottom: insets.bottom + 8,
      }}
    >
      {/* Header */}
      <Animated.View
        entering={FadeIn.duration(300)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 16,
          paddingHorizontal: 24,
          paddingTop: 16,
          paddingBottom: 8,
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
            Something good.
          </Text>
          <Text style={{ color: '#6B7280', fontSize: 15, marginTop: 2 }}>
            One at a time. Swipe when you're ready.
          </Text>
        </View>
        {page < videoCount && videoCount > 0 && (
          <Text style={{ color: '#4B5563', fontSize: 15, fontFamily: 'Inter_600SemiBold' }}>
            {page + 1}/{videoCount}
          </Text>
        )}
      </Animated.View>

      {isLoading ? (
        <LoadingSpinner message="Finding the good stuff…" />
      ) : videoCount === 0 ? (
        <View className="flex-1 items-center justify-center px-10">
          <Text className="text-text-muted text-base text-center">
            Nothing here yet — check back soon.
          </Text>
        </View>
      ) : (
        <>
          <FlatList
            data={slides}
            keyExtractor={(s, i) => (s.kind === 'video' ? s.item.id : `end-${i}`)}
            renderItem={renderSlide}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const next = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
              if (next !== page) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setPage(next);
              }
            }}
            style={{ flex: 1 }}
          />

          {/* Progress dots */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 6,
              paddingVertical: 12,
            }}
          >
            {slides.map((_, i) => (
              <View
                key={i}
                style={{
                  width: i === page ? 18 : 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: i === page ? '#C4C9D0' : '#2A2D30',
                }}
              />
            ))}
          </View>
        </>
      )}
    </View>
  );
}
