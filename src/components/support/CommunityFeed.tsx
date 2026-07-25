import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { useCommunityFeed, useCreatePost, useReactToPost, usePostComments, useAddComment, useReportPost, TALK_REPORT_REASONS } from '@/hooks/useCommunity';
import { useBlockUser } from '@/hooks/useMessages';
import { useSendMessageRequest } from '@/hooks/useDirectMessages';
import { useAuthStore } from '@/store/authStore';

const REACTIONS = [
  { key: 'heart' as const, emoji: '❤️' },
  { key: 'clap' as const, emoji: '👏' },
  { key: 'handshake' as const, emoji: '🤝' },
];

export function CommunityFeed({
  onTalkToAi,
  onFindMentor,
  initialPostId,
}: {
  onTalkToAi?: () => void;
  onFindMentor?: () => void;
  initialPostId?: string;
}) {
  const router = useRouter();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isRefetching, isError, refetch } = useCommunityFeed();
  const { mutate: createPost, isPending } = useCreatePost();
  const { mutate: react } = useReactToPost();
  const { mutate: blockUser } = useBlockUser();
  const { mutate: sendMessageRequest } = useSendMessageRequest();
  const myUserId = useAuthStore((s) => s.user?.id);
  const myUsername = useAuthStore((s) => s.profile?.username);
  const [newPost, setNewPost] = useState('');
  const [isAnon, setIsAnon] = useState(true);
  const [justPosted, setJustPosted] = useState(false);
  const [openComments, setOpenComments] = useState<string | null>(initialPostId ?? null);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});

  const posts = data?.pages.flat() ?? [];
  const { data: comments = [], isError: commentsError, refetch: refetchComments } = usePostComments(openComments);
  const { mutate: addComment, isPending: isSavingComment } = useAddComment();
  const { mutate: reportPost } = useReportPost();

  const handleMessageRequest = (post: { user_id: string; username?: string | null }) => {
    sendMessageRequest(post.user_id, {
      onSuccess: (thread) => {
        router.push({
          pathname: '/messages/[requestId]',
          params: {
            requestId: thread.id,
            type: 'dm',
            username: (post as any).username ?? 'Member',
            otherUserId: post.user_id,
          },
        } as any);
      },
      onError: (e) =>
        Alert.alert(
          'Could not start',
          e instanceof Error ? e.message : 'Please try again.',
        ),
    });
  };

  const showReportReasons = (postId: string) => Alert.alert('Why are you reporting this?', undefined, [
    { text: 'Cancel', style: 'cancel' },
    ...TALK_REPORT_REASONS.map((reason) => ({
      text: reason,
      onPress: () => reportPost({ postId, reason }, {
        onSuccess: () => Alert.alert('Reported', 'Thank you. We will review it.'),
        onError: (error) => Alert.alert('Could not report', error instanceof Error ? error.message : 'Please try again.'),
      }),
    })),
  ]);

  const showPostActions = (post: {
    id: string;
    user_id: string;
    is_anonymous: boolean;
    username?: string | null;
  }) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('This post', undefined, [
      { text: 'Cancel', style: 'cancel' },
      // DMs only exist for people posting under their username — messaging
      // an anonymous poster would unmask them.
      ...(!post.is_anonymous
        ? [{ text: 'Send message request', onPress: () => handleMessageRequest(post) }]
        : []),
      {
        text: 'Report post',
        onPress: () => showReportReasons(post.id),
      },
      {
        text: 'Block this poster',
        style: 'destructive',
        onPress: () =>
          Alert.alert(
            'Block this poster?',
            "You won't see their posts anymore, and you can't message each other.",
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Block',
                style: 'destructive',
                onPress: () => blockUser(post.user_id),
              },
            ],
          ),
      },
    ]);
  };

  const handlePost = () => {
    if (!newPost.trim() || isPending) return;
    createPost(
      { content: newPost.trim(), isAnonymous: isAnon },
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
        <Text className="text-text-muted text-sm mb-2 leading-relaxed">
          The rough nights and the small wins both belong here.
        </Text>
        <TextInput
          value={newPost}
          onChangeText={(t) => {
            setNewPost(t);
            if (justPosted) setJustPosted(false);
          }}
          placeholder="Struggling? Celebrating 10 days? Say it here…"
          placeholderTextColor="#817B91"
          multiline
          maxLength={280}
          className="text-text-primary text-base leading-relaxed min-h-[64px]"
          selectionColor="#B2ACC0"
        />
        {!!newPost.trim() && (
          <Text className="text-text-muted text-sm mt-2 leading-relaxed">
            People can send ❤️ 👏 🤝 or leave up to three comments.
          </Text>
        )}
        <View className="flex-row items-center justify-between mt-3">
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setIsAnon((v) => !v);
            }}
            hitSlop={8}
            className="flex-1 pr-3"
          >
            {/* Truncate long usernames so this label can never push Post off-screen. */}
            <Text className="text-text-muted text-sm" numberOfLines={1} ellipsizeMode="middle">
              {isAnon
                ? '◆ Anonymous · tap for your name'
                : `◇ As ${myUsername ?? 'you'} · tap for anonymous`}
            </Text>
          </Pressable>
          <Pressable
            onPress={handlePost}
            disabled={!newPost.trim() || isPending}
            className={`px-5 py-2.5 rounded-xl ${
              newPost.trim() && !isPending ? 'bg-accent' : 'bg-surface-2'
            }`}
          >
            {isPending ? (
              <ActivityIndicator size="small" color="#ECE9F1" />
            ) : (
              <Text className="text-white text-sm font-semibold">Post</Text>
            )}
          </Pressable>
        </View>
      </View>

      {/* Quiet path to professional help, right where people open up */}
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push('/counsellors');
        }}
        className="mx-4 mb-4 flex-row items-center justify-between bg-surface rounded-xl px-4 py-3 border border-white/5 active:border-white/15"
      >
        <Text className="text-text-muted text-sm flex-1 pr-3">
          Rather talk to a professional?{' '}
          <Text className="text-text-secondary font-medium">Find a counsellor</Text>
        </Text>
        <Text className="text-text-muted text-sm">→</Text>
      </Pressable>

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
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        onEndReached={() => hasNextPage && fetchNextPage()}
        onEndReachedThreshold={0.3}
        refreshing={isRefetching && !isFetchingNextPage}
        onRefresh={() => refetch()}
        renderItem={({ item, index }) => (
          <Animated.View
            entering={FadeInDown.duration(300).delay(index * 30).springify()}
            className="mb-3"
          >
            <Card elevated>
              <View className="flex-row items-start gap-3 mb-3">
                <Avatar username={item.is_anonymous ? 'A' : (item as any).username} size="sm" />
                <View className="flex-1">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-text-secondary text-sm font-medium">
                      {item.is_anonymous ? 'Anonymous' : (item as any).username ?? 'Member'}
                    </Text>
                    {(item as any).is_official ? <Text className="text-accent text-xs font-semibold">Official</Text> : null}
                  </View>
                  <Text className="text-text-muted text-sm mt-0.5">
                    {new Date(item.created_at).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </Text>
                </View>
                {item.user_id !== myUserId && !(item as any).is_official && (
                  <Pressable onPress={() => showPostActions(item)} hitSlop={12}>
                    <Text className="text-text-muted text-lg">⋯</Text>
                  </Pressable>
                )}
              </View>
              <Text className="text-text-primary text-base leading-relaxed mb-4">
                {item.content}
              </Text>
              <View className="flex-row flex-wrap gap-3">
                {REACTIONS.map(({ key, emoji }) => {
                  const reactions = (item.reactions as Record<string, number>) ?? {};
                  const count = reactions[key] ?? 0;
                  return (
                    <Pressable
                      key={key}
                      disabled={(item as any).is_seed_content || item.user_id === myUserId || (item as any).my_reaction === key}
                      onPress={async () => {
                        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        react({ postId: item.id, reaction: key, currentReactions: reactions, currentReaction: (item as any).my_reaction }, {
                          onError: () => Alert.alert('Could not react', 'Please try again.'),
                        });
                      }}
                      className={`flex-row items-center gap-1.5 rounded-lg px-3 py-2 ${(item as any).my_reaction === key ? 'bg-accent/25 border border-accent/50' : 'bg-surface-2'} ${(item as any).is_seed_content || item.user_id === myUserId ? 'opacity-60' : 'active:bg-white/10'}`}
                    >
                      <Text className="text-base">{emoji}</Text>
                      {count > 0 && (
                        <Text className="text-text-muted text-sm">{count}</Text>
                      )}
                    </Pressable>
                  );
                })}
                <Pressable
                  disabled={(item as any).is_seed_content}
                  onPress={() => setOpenComments(openComments === item.id ? null : item.id)}
                  className={`flex-row items-center gap-1.5 bg-surface-2 rounded-lg px-3 py-2 ${(item as any).is_seed_content ? 'opacity-60' : 'active:bg-white/10'}`}
                >
                  <Text className="text-text-secondary text-sm">Comment</Text>
                  {((item as any).comment_count ?? 0) > 0 && (
                    <Text className="text-text-muted text-sm">{(item as any).comment_count}</Text>
                  )}
                </Pressable>
              </View>
              {item.user_id !== myUserId && !(item as any).is_official && (
                <Pressable onPress={() => showReportReasons(item.id)} hitSlop={8} className="self-end mt-2">
                  <Text className="text-text-muted text-xs">Report</Text>
                </Pressable>
              )}
              {openComments === item.id && (() => {
                const postComments = comments.filter((comment) => comment.post_id === item.id);
                const mine = postComments.filter((comment) => comment.user_id === myUserId).length;
                const atLimit = mine >= 3;
                const draft = commentDrafts[item.id] ?? '';
                return (
                  <View className="mt-4 border-t border-white/5 pt-3">
                    {commentsError && (
                      <Pressable onPress={() => refetchComments()} className="mb-3">
                        <Text className="text-danger text-sm">Comments couldn't load. Tap to retry.</Text>
                      </Pressable>
                    )}
                    {postComments.map((comment) => (
                      <View key={comment.id} className="flex-row gap-2 mb-3">
                        <Avatar username={comment.username} size="sm" />
                        <View className="flex-1">
                          <Text className="text-text-secondary text-sm font-medium">{comment.username}</Text>
                          <Text className="text-text-muted text-xs mb-1">{new Date(comment.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</Text>
                          <Text className="text-text-primary text-sm leading-relaxed">{comment.content}</Text>
                        </View>
                      </View>
                    ))}
                    {atLimit ? (
                      <Text className="text-text-muted text-sm">You've reached the 3 comment limit for this post.</Text>
                    ) : (
                      <View className="flex-row items-end gap-2">
                        <TextInput value={draft} onChangeText={(text) => setCommentDrafts((current) => ({ ...current, [item.id]: text }))}
                          editable={!isSavingComment} placeholder="Add a comment…" placeholderTextColor="#817B91" multiline maxLength={500}
                          className="flex-1 bg-surface-2 rounded-xl px-3 py-2 text-text-primary text-sm" />
                        <Pressable disabled={!draft.trim() || isSavingComment} onPress={() => addComment({ postId: item.id, content: draft }, {
                          onSuccess: () => setCommentDrafts((current) => ({ ...current, [item.id]: '' })),
                          onError: (error) => Alert.alert('Could not comment', error instanceof Error ? error.message : 'Please try again.'),
                        })} className={`rounded-xl px-3 py-2 ${draft.trim() && !isSavingComment ? 'bg-accent' : 'bg-surface-2'}`}>
                          {isSavingComment ? <ActivityIndicator size="small" color="#ECE9F1" /> : <Text className="text-bg text-sm font-semibold">Send</Text>}
                        </Pressable>
                      </View>
                    )}
                  </View>
                );
              })()}
            </Card>
          </Animated.View>
        )}
        ListFooterComponent={
          isFetchingNextPage ? (
            <ActivityIndicator size="small" color="#B2ACC0" className="mt-4" />
          ) : null
        }
        ListEmptyComponent={
          <View className="py-12 items-center">
            <Text className="text-text-muted text-base text-center leading-relaxed">
              {isError ? "Community couldn't load." : 'Be the first to share something.'}{'\n'}
              {!isError && <>Bad day, good day, day one, day ninety —{'\n'}it all belongs here.</>}
            </Text>
            {isError && <Pressable onPress={() => refetch()} className="mt-4 bg-surface-2 rounded-xl px-4 py-2"><Text className="text-text-secondary text-sm">Try again</Text></Pressable>}
          </View>
        }
      />
    </View>
  );
}
