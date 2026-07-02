import React from 'react';
import { View, Text, Pressable, ScrollView, Image, Linking } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { useGoodFeed, thumbnailUrl, watchUrl } from '@/hooks/useGoodFeed';
import { headingShadow } from '@/styles';

const CATEGORY_LABELS: Record<string, string> = {
  kindness: 'Kindness',
  animals: 'Animals',
  reunions: 'Reunions',
  fails: 'Fails',
  rescues: 'Rescues',
  wholesome: 'Wholesome',
};

export default function GoodFeedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: items, isLoading } = useGoodFeed();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#0E0F10',
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
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
            Something good.
          </Text>
          <Text style={{ color: '#6B7280', fontSize: 15, marginTop: 2 }}>
            Today's picks. Then back to life.
          </Text>
        </View>
      </Animated.View>

      {isLoading ? (
        <LoadingSpinner message="Finding the good stuff…" />
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          {(items ?? []).map((item, i) => (
            <Animated.View
              key={item.id}
              entering={FadeInDown.duration(300).delay(i * 60)}
            >
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  Linking.openURL(watchUrl(item.youtube_id)).catch(() => {});
                }}
                className="bg-surface rounded-2xl mb-4 border border-white/5 active:border-white/20 overflow-hidden"
              >
                <Image
                  source={{ uri: thumbnailUrl(item.youtube_id) }}
                  style={{ width: '100%', aspectRatio: 16 / 9, backgroundColor: '#161718' }}
                  resizeMode="cover"
                />
                <View className="px-4 py-3">
                  <Text className="text-text-primary text-base font-medium leading-snug mb-1">
                    {item.title}
                  </Text>
                  <Text className="text-text-muted text-sm">
                    {CATEGORY_LABELS[item.category] ?? item.category} · plays on YouTube
                  </Text>
                </View>
              </Pressable>
            </Animated.View>
          ))}

          {(items ?? []).length === 0 && (
            <View className="py-16 items-center">
              <Text className="text-text-muted text-base text-center">
                Nothing here yet — check back soon.
              </Text>
            </View>
          )}

          {/* Deliberate end — this is a stack, not a scroll hole */}
          {(items ?? []).length > 0 && (
            <Animated.View
              entering={FadeIn.duration(400)}
              className="bg-surface rounded-2xl px-6 py-8 mt-2 mb-4 border border-white/8 items-center"
            >
              <Text className="text-text-primary text-lg font-semibold mb-2 text-center">
                That's the good stuff for now.
              </Text>
              <Text className="text-text-secondary text-base mb-6 text-center leading-relaxed">
                Fresh picks tomorrow. How are you feeling?
              </Text>
              <Button
                title="Done"
                variant="primary"
                size="md"
                fullWidth
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.back();
                }}
              />
            </Animated.View>
          )}
        </ScrollView>
      )}
    </View>
  );
}
