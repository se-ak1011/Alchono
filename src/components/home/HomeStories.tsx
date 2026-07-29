import React from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCommunityMoments } from '@/hooks/useMoments';

export function HomeStories() {
  const router = useRouter();
  // Deliberately use the exact same query/cache entry as Community → Look.
  // Home is only a view over that feed, never a separate stories collection.
  const { data: moments = [], isLoading } = useCommunityMoments();
  const videos = moments
    .filter((moment) => moment.media_type === 'video')
    .slice(0, 8);

  const openCommunity = () => router.push({ pathname: '/community', params: { tab: 'look' } });

  return (
    <View className="mt-5">
      <View className="flex-row items-center justify-between px-6 mb-3">
        <Text className="text-text-primary text-xl font-semibold">Stories</Text>
        <Pressable onPress={openCommunity} hitSlop={8} className="active:opacity-60">
          <Text className="text-accent text-sm font-semibold">See More</Text>
        </Pressable>
      </View>
      {isLoading ? (
        <View className="h-24 items-center justify-center"><ActivityIndicator color="#817B91" /></View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, gap: 14 }}>
          <Pressable
            onPress={() => router.push('/moments/new')}
            className="items-center active:opacity-70"
            style={{ width: 70 }}
            accessibilityLabel="Add your story"
          >
            <View className="items-center justify-center bg-surface border border-white/10" style={{ width: 66, height: 66, borderRadius: 33 }}>
              <Feather name="plus" size={27} color="#B9A4EC" />
              <View className="absolute right-0 bottom-0 items-center justify-center bg-accent border-2 border-bg" style={{ width: 23, height: 23, borderRadius: 12 }}>
                <Feather name="plus" size={14} color="#201D28" />
              </View>
            </View>
            <Text className="text-text-secondary text-xs mt-1.5" numberOfLines={1}>Your story</Text>
          </Pressable>

          {videos.map((moment) => (
            <Pressable
              key={moment.id}
              onPress={() => router.push({ pathname: '/moments/play', params: { momentId: moment.id, type: moment.media_type, poster: moment.thumb_url ?? '', caption: moment.caption ?? '', captionPos: moment.caption_position ?? '' } })}
              className="items-center active:opacity-70"
              style={{ width: 70 }}
            >
              <View style={{ width: 66, height: 66, borderRadius: 33, padding: 2, borderWidth: 2, borderColor: '#A489DE' }}>
                {moment.thumb_url ? <Image source={{ uri: moment.thumb_url }} style={{ flex: 1, borderRadius: 30, backgroundColor: '#302B3A' }} /> : <View style={{ flex: 1, borderRadius: 30, backgroundColor: '#302B3A' }} />}
                {moment.media_type === 'video' ? (
                  <View className="absolute inset-0 items-center justify-center"><Feather name="play" size={18} color="#fff" /></View>
                ) : null}
              </View>
              <Text className="text-text-muted text-xs mt-1.5" numberOfLines={1}>
                {moment.username ? `@${moment.username}` : 'Anonymous'}
              </Text>
            </Pressable>
          ))}
          {videos.length === 0 ? (
            <View className="justify-center pl-1 pr-5" style={{ height: 66 }}>
              <Text className="text-text-muted text-sm">No shared videos yet.</Text>
            </View>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}
