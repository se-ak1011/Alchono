import React from 'react';
import { View, Text, Pressable, Image, FlatList } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { SafeArea } from '@/components/ui/SafeArea';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { headingShadow } from '@/styles';
import { useCommunityMoments, type FeedMoment } from '@/hooks/useMoments';

function MomentCard({ item }: { item: FeedMoment }) {
  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      className="mx-6 mb-5 bg-surface rounded-3xl overflow-hidden border border-white/8"
    >
      {item.media_type === 'video' && item.url ? (
        <Video
          source={{ uri: item.url }}
          posterSource={item.thumb_url ? { uri: item.thumb_url } : undefined}
          usePoster
          useNativeControls
          resizeMode={ResizeMode.COVER}
          style={{ width: '100%', aspectRatio: 1, backgroundColor: '#15141A' }}
        />
      ) : item.url ? (
        <Image
          source={{ uri: item.url }}
          style={{ width: '100%', aspectRatio: 1, backgroundColor: '#15141A' }}
          resizeMode="cover"
        />
      ) : null}

      <View className="px-5 py-4">
        {item.caption ? (
          <Text className="text-text-primary text-base leading-relaxed mb-2">
            {item.caption}
          </Text>
        ) : null}
        <Text className="text-text-muted text-sm">
          {item.username ? `@${item.username}` : 'Anonymous'}
          {'  ·  '}
          {new Date(item.created_at).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
          })}
        </Text>
      </View>
    </Animated.View>
  );
}

export default function GoodFeedScreen() {
  const router = useRouter();
  const { data: moments, isLoading } = useCommunityMoments();

  return (
    <SafeArea>
      {/* Header */}
      <View className="px-6 pt-4 pb-3 flex-row items-start justify-between">
        <View className="flex-row items-start gap-3 flex-1">
          <Pressable onPress={() => router.back()} hitSlop={12} className="p-1 -ml-1 mt-1 active:opacity-60">
            <Feather name="chevron-left" size={26} color="#BDB6C5" />
          </Pressable>
          <View className="flex-1">
            <Text className="text-text-primary text-3xl font-semibold tracking-tight" style={headingShadow}>
              Something good.
            </Text>
            <Text className="text-text-secondary text-sm mt-1">
              Small, real moments — shared by people like you.
            </Text>
          </View>
        </View>
        <Pressable
          onPress={() => router.push('/moments')}
          hitSlop={8}
          className="bg-surface-2 rounded-full px-3.5 py-2 border border-white/10 active:opacity-70 mt-1"
        >
          <Text className="text-text-secondary text-xs font-semibold">Yours</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <LoadingSpinner message="Finding the good stuff…" />
      ) : (
        <FlatList
          data={moments ?? []}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => <MomentCard item={item} />}
          ListEmptyComponent={
            <View className="items-center px-10 mt-24">
              <Text className="text-text-secondary text-base text-center leading-relaxed">
                Nothing here yet.
              </Text>
              <Text className="text-text-muted text-sm text-center leading-relaxed mt-2">
                Be the first to share something good — a walk, a meal, a small
                win from your day.
              </Text>
              <Pressable
                onPress={() => router.push('/moments/new')}
                className="mt-6 bg-accent rounded-2xl px-6 py-3 active:bg-accent-dark"
              >
                <Text className="text-bg text-base font-semibold">Share a moment</Text>
              </Pressable>
            </View>
          }
        />
      )}

      {/* Share button */}
      {(moments?.length ?? 0) > 0 && (
        <Pressable
          onPress={() => router.push('/moments/new')}
          className="absolute bottom-8 right-6 w-14 h-14 rounded-full bg-accent items-center justify-center active:bg-accent-dark"
          style={{
            shadowColor: '#000',
            shadowOpacity: 0.4,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 4 },
          }}
        >
          <Feather name="plus" size={26} color="#15141A" />
        </Pressable>
      )}
    </SafeArea>
  );
}
