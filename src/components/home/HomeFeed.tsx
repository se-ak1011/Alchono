import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Avatar } from '@/components/ui/Avatar';
import { useCommunityFeed, useReactToPost, usePostComments, useAddComment } from '@/hooks/useCommunity';
import { useAuthStore } from '@/store/authStore';

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
  const myUserId = useAuthStore((state) => state.user?.id);
  const [openComments, setOpenComments] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const { mutate: react } = useReactToPost();
  const { data: comments = [] } = usePostComments(openComments);
  const { mutate: addComment, isPending: savingComment } = useAddComment();
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
              <View key={post.id} className="bg-surface rounded-2xl border border-white/8 p-4">
                <Pressable onPress={() => openTalk(post.id)} className="active:opacity-70">
                <View className="flex-row items-center gap-3">
                  <Avatar username={username} size="sm" />
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2">
                      <Text className="text-text-primary text-sm font-semibold">{username}</Text>
                      {(post as any).is_official ? <Text className="text-accent text-xs font-semibold">Official</Text> : null}
                    </View>
                    <Text className="text-text-muted text-xs mt-0.5">{relativeTime(post.created_at)}</Text>
                  </View>
                </View>
                <Text className="text-text-secondary text-base leading-relaxed mt-3" numberOfLines={4}>{post.content}</Text>
                </Pressable>
                <View className="flex-row flex-wrap gap-2 mt-3">
                  {([['heart', '❤️'], ['clap', '👏'], ['handshake', '🤝']] as const).map(([reaction, emoji]) => (
                    <Pressable key={reaction}
                      disabled={(post as any).is_seed_content || post.user_id === myUserId || (post as any).my_reaction === reaction}
                      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); react({ postId: post.id, reaction, currentReactions: post.reactions as Record<string, number>, currentReaction: (post as any).my_reaction }, { onError: () => Alert.alert('Could not react', 'Please try again.') }); }}
                      className={`rounded-lg px-3 py-2 ${(post as any).my_reaction === reaction ? 'bg-accent/25 border border-accent/50' : 'bg-surface-2'} ${(post as any).is_seed_content || post.user_id === myUserId ? 'opacity-60' : ''}`}>
                      <Text>{emoji}{((post.reactions as any)?.[reaction] ?? 0) > 0 ? ` ${(post.reactions as any)[reaction]}` : ''}</Text>
                    </Pressable>
                  ))}
                  <Pressable disabled={(post as any).is_seed_content} onPress={() => { setOpenComments(openComments === post.id ? null : post.id); setDraft(''); }} className={`rounded-lg px-3 py-2 bg-surface-2 ${(post as any).is_seed_content ? 'opacity-60' : ''}`}>
                    <Text className="text-text-secondary text-sm">Comment{(post as any).comment_count ? ` ${(post as any).comment_count}` : ''}</Text>
                  </Pressable>
                </View>
                {openComments === post.id && (() => {
                  const postComments = comments.filter((comment) => comment.post_id === post.id);
                  const mine = postComments.filter((comment) => comment.user_id === myUserId).length;
                  return <View className="mt-3 border-t border-white/5 pt-3">
                    {postComments.map((comment) => <View key={comment.id} className="mb-2"><Text className="text-text-secondary text-xs font-semibold">{comment.username}</Text><Text className="text-text-primary text-sm">{comment.content}</Text></View>)}
                    {mine >= 3 ? <Text className="text-text-muted text-sm">You've reached the 3 comment limit for this post.</Text> : <View className="flex-row items-end gap-2">
                      <TextInput value={draft} onChangeText={setDraft} editable={!savingComment} placeholder="Add a comment…" placeholderTextColor="#817B91" multiline maxLength={500} className="flex-1 bg-surface-2 rounded-xl px-3 py-2 text-text-primary text-sm" />
                      <Pressable disabled={!draft.trim() || savingComment} onPress={() => addComment({ postId: post.id, content: draft }, { onSuccess: () => setDraft(''), onError: (error) => Alert.alert('Could not comment', error instanceof Error ? error.message : 'Please try again.') })} className="bg-accent rounded-xl px-3 py-2"><Text className="text-bg text-sm font-semibold">Send</Text></Pressable>
                    </View>}
                  </View>;
                })()}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}
