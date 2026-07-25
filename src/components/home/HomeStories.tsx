import React from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCommunityMoments } from '@/hooks/useMoments';

export function HomeStories() {
  const router = useRouter();
  const { data: moments = [], isLoading } = useCommunityMoments(8);

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
      ) : moments.length === 0 ? (
        <View className="mx-6 rounded-2xl bg-surface border border-white/8 px-4 py-4">
          <Text className="text-text-muted text-sm">No stories yet.</Text>
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, gap: 14 }}>
          {moments.map((moment) => (
            <Pressable
              key={moment.id}
              onPress={() => moment.url && router.push({ pathname: '/moments/play', params: { uri: moment.url, type: moment.media_type } })}
              className="items-center active:opacity-70"
              style={{ width: 70 }}
            >
              <View style={{ width: 66, height: 66, borderRadius: 33, padding: 2, borderWidth: 2, borderColor: '#A489DE' }}>
                <Image source={{ uri: moment.thumb_url ?? moment.url ?? undefined }} style={{ flex: 1, borderRadius: 30, backgroundColor: '#302B3A' }} />
                {moment.media_type === 'video' ? (
                  <View className="absolute inset-0 items-center justify-center"><Feather name="play" size={18} color="#fff" /></View>
                ) : null}
              </View>
              <Text className="text-text-muted text-xs mt-1.5" numberOfLines={1}>
                {moment.username ? `@${moment.username}` : 'Anonymous'}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
