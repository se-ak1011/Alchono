import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { useCommunityFeed, useCreatePost, useReactToPost } from '@/hooks/useCommunity';

const REACTIONS = [
  { key: 'heart' as const, emoji: '❤️' },
  { key: 'clap' as const, emoji: '👏' },
  { key: 'handshake' as const, emoji: '🤝' },
];

export function CommunityFeed({
  onTalkToAi,
  onFindMentor,
}: {
  onTalkToAi?: () => void;
  onFindMentor?: () => void;
}) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useCommunityFeed();
  const { mutate: createPost, isPending } = useCreatePost();
  const { mutate: react } = useReactToPost();
  const [newPost, setNewPost] = useState('');
  const [justPosted, setJustPosted] = useState(false);

  const posts = data?.pages.flat() ?? [];

  const handlePost = () => {
    if (!newPost.trim() || isPending) return;
    createPost(
      { content: newPost.trim(), isAnonymous: true },
      {
        onSuccess: () => {
          setNewPost('');
          setJustPosted(true);
        },
      },
    );
  };

  return (
    <View className="flex-1">
      {/* Compose box */}
      <View className="mx-4 mb-4 bg-surface rounded-2xl p-5 border border-white/5">
        <TextInput
          value={newPost}
          onChangeText={(t) => {
            setNewPost(t);
            if (justPosted) setJustPosted(false);
          }}
          placeholder="Share something with the community…"
          placeholderTextColor="#5E6472"
          multiline
          maxLength={280}
          className="text-text-primary text-base leading-relaxed min-h-[64px]"
          selectionColor="#9CA3AF"
        />
        {!!newPost.trim() && (
          <Text className="text-text-muted text-sm mt-2 leading-relaxed">
            People can send ❤️ 👏 🤝 — but nobody can reply to posts.
          </Text>
        )}
        <View className="flex-row items-center justify-between mt-3">
          <Text className="text-text-muted text-sm">Anonymous post</Text>
          <Pressable
            onPress={handlePost}
            disabled={!newPost.trim() || isPending}
            className={`px-5 py-2.5 rounded-xl ${
              newPost.trim() && !isPending ? 'bg-accent' : 'bg-surface-2'
            }`}
          >
            {isPending ? (
              <ActivityIndicator size="small" color="#F6F5F2" />
            ) : (
              <Text className="text-white text-sm font-semibold">Post</Text>
            )}
          </Pressable>
        </View>
      </View>

      {/* Post-share nudge — posting is a shout, this offers a conversation too */}
      {justPosted && (
        <Animated.View
          entering={FadeInDown.duration(300)}
          className="mx-4 mb-4 bg-surface rounded-2xl p-5 border border-white/10"
        >
          <View className="flex-row items-start justify-between mb-1">
            <Text className="text-text-primary text-base font-semibold flex-1 pr-3">
              Shared. That took something.
            </Text>
            <Pressable onPress={() => setJustPosted(false)} hitSlop={12}>
              <Text className="text-text-muted text-base">✕</Text>
            </Pressable>
          </View>
          <Text className="text-text-secondary text-sm leading-relaxed mb-4">
            Reactions will come. And if you'd rather have an actual
            conversation right now, that's here too:
          </Text>
          <View className="flex-row gap-2">
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setJustPosted(false);
                onTalkToAi?.();
              }}
              className="flex-1 items-center py-3 rounded-xl bg-accent active:bg-accent-dark"
            >
              <Text className="text-bg text-sm font-semibold">Talk to the AI</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setJustPosted(false);
                onFindMentor?.();
              }}
              className="flex-1 items-center py-3 rounded-xl bg-surface-2 border border-white/10 active:border-white/25"
            >
              <Text className="text-text-primary text-sm font-semibold">Find a mentor</Text>
            </Pressable>
          </View>
        </Animated.View>
      )}

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        onEndReached={() => hasNextPage && fetchNextPage()}
        onEndReachedThreshold={0.3}
        renderItem={({ item, index }) => (
          <Animated.View
            entering={FadeInDown.duration(300).delay(index * 30).springify()}
            className="mb-3"
          >
            <Card elevated>
              <View className="flex-row items-start gap-3 mb-3">
                <Avatar username={item.is_anonymous ? 'A' : (item as any).username} size="sm" />
                <View className="flex-1">
                  <Text className="text-text-secondary text-sm font-medium">
                    {item.is_anonymous ? 'Anonymous' : (item as any).username ?? 'Member'}
                  </Text>
                  <Text className="text-text-muted text-sm mt-0.5">
                    {new Date(item.created_at).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </Text>
                </View>
              </View>
              <Text className="text-text-primary text-base leading-relaxed mb-4">
                {item.content}
              </Text>
              <View className="flex-row gap-3">
                {REACTIONS.map(({ key, emoji }) => {
                  const reactions = (item.reactions as Record<string, number>) ?? {};
                  const count = reactions[key] ?? 0;
                  return (
                    <Pressable
                      key={key}
                      onPress={async () => {
                        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        react({ postId: item.id, reaction: key, currentReactions: reactions });
                      }}
                      className="flex-row items-center gap-1.5 bg-surface-2 rounded-lg px-3 py-2 active:bg-white/10"
                    >
                      <Text className="text-base">{emoji}</Text>
                      {count > 0 && (
                        <Text className="text-text-muted text-sm">{count}</Text>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </Card>
          </Animated.View>
        )}
        ListFooterComponent={
          isFetchingNextPage ? (
            <ActivityIndicator size="small" color="#9CA3AF" className="mt-4" />
          ) : null
        }
        ListEmptyComponent={
          <View className="py-12 items-center">
            <Text className="text-text-muted text-base text-center">
              Be the first to share something.{'\n'}This is a safe space.
            </Text>
          </View>
        }
      />
    </View>
  );
}
