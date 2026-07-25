import React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Avatar } from '@/components/ui/Avatar';
import { useCommunityFeed } from '@/hooks/useCommunity';

const MAX_HOME_POSTS = 4;

function relativeTime(value: string) {
  const minutes = Math.max(1, Math.floor((Date.now() - new Date(value).getTime()) / 60_000));
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export function HomeFeed() {
  const router = useRouter();
  const { data, isLoading } = useCommunityFeed(MAX_HOME_POSTS);
  const posts = (data?.pages.flat() ?? []).slice(0, MAX_HOME_POSTS);
  const openTalk = (postId?: string) => router.push({ pathname: '/community', params: { tab: 'talk', post: postId } });

  return (
    <View className="mx-6 mt-8 mb-10">
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-text-primary text-xl font-semibold">Community</Text>
        <Pressable onPress={() => openTalk()} hitSlop={8} className="active:opacity-60">
          <Text className="text-accent text-sm font-semibold">See More</Text>
        </Pressable>
      </View>
      {isLoading ? (
        <View className="h-28 items-center justify-center"><ActivityIndicator color="#817B91" /></View>
      ) : posts.length === 0 ? (
        <View className="rounded-2xl bg-surface border border-white/8 px-4 py-4">
          <Text className="text-text-muted text-sm">Be the first to start the conversation.</Text>
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          {posts.map((post) => {
            const username = post.is_anonymous ? 'Anonymous' : ((post as any).username ?? 'Member');
            const reactions = Object.values((post.reactions as Record<string, number>) ?? {}).reduce((sum, count) => sum + count, 0);
            return (
              <Pressable key={post.id} onPress={() => openTalk(post.id)} className="bg-surface rounded-2xl border border-white/8 p-4 active:border-white/20">
                <View className="flex-row items-center gap-3">
                  <Avatar username={username} size="sm" />
                  <View className="flex-1">
                    <Text className="text-text-primary text-sm font-semibold">{username}</Text>
                    <Text className="text-text-muted text-xs mt-0.5">{relativeTime(post.created_at)}</Text>
                  </View>
                </View>
                <Text className="text-text-secondary text-base leading-relaxed mt-3" numberOfLines={4}>{post.content}</Text>
                <Text className="text-text-muted text-xs mt-3">{reactions} {reactions === 1 ? 'reaction' : 'reactions'}</Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}
