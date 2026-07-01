import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { useCommunityFeed, useCreatePost, useReactToPost } from '@/hooks/useCommunity';

const REACTIONS = [
  { key: 'heart' as const,      label: '♥' },
  { key: 'clap' as const,       label: '+1' },
  { key: 'handshake' as const,  label: '→' },
];

const MAX_HOME_POSTS = 6;

export function HomeFeed() {
  const { data, isLoading } = useCommunityFeed();
  const { mutate: createPost, isPending: isPosting } = useCreatePost();
  const { mutate: react } = useReactToPost();
  const [newPost, setNewPost] = useState('');

  const posts = (data?.pages.flat() ?? []).slice(0, MAX_HOME_POSTS);

  const handlePost = () => {
    if (!newPost.trim() || isPosting) return;
    createPost(
      { content: newPost.trim(), isAnonymous: true },
      { onSuccess: () => setNewPost('') },
    );
  };

  return (
    <View className="mx-6 mt-6">
      {/* Section header */}
      <View className="flex-row items-center gap-3 mb-4">
        <Text className="text-text-muted text-xs font-semibold tracking-widest uppercase">
          Community
        </Text>
        <View className="flex-1 h-px bg-white/5" />
      </View>

      {/* Compose */}
      <View className="bg-surface rounded-lg border border-white/8 p-3 mb-4">
        <TextInput
          value={newPost}
          onChangeText={setNewPost}
          placeholder="Share with the group…"
          placeholderTextColor="#5E6472"
          multiline
          maxLength={280}
          style={{ color: '#F6F5F2', fontSize: 14, lineHeight: 20, minHeight: 44 }}
          selectionColor="#9CA3AF"
        />
        {newPost.trim().length > 0 && (
          <View className="flex-row items-center justify-between mt-2 pt-2 border-t border-white/5">
            <Text className="text-text-muted text-xs">Anonymous</Text>
            <Pressable
              onPress={handlePost}
              disabled={isPosting}
              className="bg-accent/90 rounded px-3 py-1.5 active:bg-accent-dark"
            >
              {isPosting
                ? <ActivityIndicator size="small" color="#F6F5F2" />
                : <Text className="text-white text-xs font-semibold tracking-wide">POST</Text>
              }
            </Pressable>
          </View>
        )}
      </View>

      {/* Posts */}
      {isLoading ? (
        <ActivityIndicator size="small" color="#5E6472" style={{ marginVertical: 24 }} />
      ) : posts.length === 0 ? (
        <View className="py-10 items-center">
          <Text className="text-text-muted text-sm text-center">
            Be the first to post.
          </Text>
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          {posts.map((post, index) => {
            const reactions = (post.reactions as Record<string, number>) ?? {};
            return (
              <Animated.View
                key={post.id}
                entering={FadeInDown.duration(300).delay(index * 40).springify()}
              >
                <Card elevated>
                  <View className="flex-row items-start gap-3 mb-2">
                    <Avatar
                      username={post.is_anonymous ? 'A' : (post as any).profiles?.username}
                      size="sm"
                    />
                    <View className="flex-1">
                      <Text className="text-text-muted text-xs font-medium">
                        {post.is_anonymous ? 'Anonymous' : ((post as any).profiles?.username ?? 'Member')}
                      </Text>
                    </View>
                    <Text className="text-text-muted text-xs">
                      {new Date(post.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </Text>
                  </View>
                  <Text className="text-text-primary text-sm leading-relaxed mb-3">
                    {post.content}
                  </Text>
                  <View className="flex-row gap-2">
                    {REACTIONS.map(({ key, label }) => {
                      const count = reactions[key] ?? 0;
                      return (
                        <Pressable
                          key={key}
                          onPress={async () => {
                            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            react({ postId: post.id, reaction: key, currentReactions: reactions });
                          }}
                          className="flex-row items-center gap-1 bg-surface-2 rounded px-2.5 py-1 border border-white/5 active:border-white/15"
                        >
                          <Text className="text-text-secondary text-sm">{label}</Text>
                          {count > 0 && (
                            <Text className="text-text-muted text-xs">{count}</Text>
                          )}
                        </Pressable>
                      );
                    })}
                  </View>
                </Card>
              </Animated.View>
            );
          })}
        </View>
      )}
    </View>
  );
}
