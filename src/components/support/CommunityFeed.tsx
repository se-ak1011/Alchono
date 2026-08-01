import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Avatar } from '@/components/ui/Avatar';
import { RoleBadge } from '@/components/ui/RoleBadge';
import { useCommunityFeed, useCreatePost, useReactToPost, usePostComments, useAddComment, useReportPost, TALK_REPORT_REASONS } from '@/hooks/useCommunity';
import { useBlockUser } from '@/hooks/useMessages';
import { useSendMessageRequest } from '@/hooks/useDirectMessages';
import { useAuthStore } from '@/store/authStore';
import { PRESENCE, type PresenceStatus } from '@/lib/presence';
import { MyStatusPill } from '@/components/support/PresenceControls';

/**
 * Talk — reskinned as a cosy late-90s message board / chat-room: monospace
 * handles, a little presence dot, speech bubbles rising off each avatar, a
 * "> new message" composer. It's the exact same board underneath (posts,
 * anonymous toggle, reactions, the 3-comment limit, report/block, DM
 * requests, pagination) — just dressed as a place you hang out, not a feed.
 */
const MONO = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }) as string;
const ONLINE = '#7FB08A'; // decorative presence bullet — a warm retro green
const PLUM = '#A489DE';

const REACTIONS = [
  { key: 'heart' as const, emoji: '❤️' },
  { key: 'clap' as const, emoji: '👏' },
  { key: 'handshake' as const, emoji: '🤝' },
];

/** Short, chat-style relative time: "just now", "9m", "3h", "2d", then a date. */
function ago(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

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
      {/* Your MSN-style status — pick your dot, set a status line. */}
      <View style={{ marginHorizontal: 16, marginBottom: 12 }}>
        <MyStatusPill />
      </View>

      {/* Composer — the retro "new message" box. */}
      <View
        style={{
          marginHorizontal: 16,
          marginBottom: 14,
          borderRadius: 14,
          backgroundColor: '#2b2635',
          borderWidth: 1,
          borderColor: 'rgba(164,137,222,0.28)',
          overflow: 'hidden',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 7, backgroundColor: 'rgba(164,137,222,0.12)', borderBottomWidth: 1, borderBottomColor: 'rgba(164,137,222,0.18)' }}>
          <Text style={{ fontFamily: MONO, fontSize: 12, color: PLUM }}>&gt;_</Text>
          <Text style={{ fontFamily: MONO, fontSize: 11.5, color: '#B2ACC0', letterSpacing: 0.5 }}>new message</Text>
        </View>
        <View style={{ padding: 14 }}>
          <TextInput
            value={newPost}
            onChangeText={(t) => {
              setNewPost(t);
              if (justPosted) setJustPosted(false);
            }}
            placeholder="Rough night? 10 days down? Type it to the room…"
            placeholderTextColor="#817B91"
            multiline
            maxLength={280}
            className="text-text-primary text-base leading-relaxed min-h-[56px]"
            selectionColor="#B2ACC0"
          />
          <View className="flex-row items-center justify-between mt-2">
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setIsAnon((v) => !v);
              }}
              hitSlop={8}
              className="flex-1 pr-3 active:opacity-70"
            >
              {/* Truncate long usernames so this label can never push Post off-screen. */}
              <Text style={{ fontFamily: MONO, fontSize: 12, color: '#817B91' }} numberOfLines={1} ellipsizeMode="middle">
                {isAnon
                  ? '[◆ anon] · tap for your name'
                  : `[◇ ${myUsername ?? 'you'}] · tap to hide`}
              </Text>
            </Pressable>
            <Pressable
              onPress={handlePost}
              disabled={!newPost.trim() || isPending}
              style={{
                paddingHorizontal: 18,
                paddingVertical: 9,
                borderRadius: 9,
                backgroundColor: newPost.trim() && !isPending ? PLUM : '#474151',
                borderWidth: 1,
                borderColor: newPost.trim() && !isPending ? '#C6B2F0' : 'rgba(236,233,241,0.12)',
              }}
            >
              {isPending ? (
                <ActivityIndicator size="small" color="#ECE9F1" />
              ) : (
                <Text style={{ fontFamily: MONO, fontSize: 13, fontWeight: '700', color: newPost.trim() ? '#201D28' : '#817B91', letterSpacing: 1 }}>POST</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>

      {/* Quiet path to professional help, right where people open up */}
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push('/counsellors');
        }}
        className="mx-4 mb-4 flex-row items-center justify-between rounded-xl px-4 py-3 active:opacity-80"
        style={{ backgroundColor: '#2b2635', borderWidth: 1, borderColor: 'rgba(236,233,241,0.08)' }}
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
          className="mx-4 mb-4 rounded-2xl p-5"
          style={{ backgroundColor: '#2b2635', borderWidth: 1, borderColor: 'rgba(164,137,222,0.3)' }}
        >
          <View className="flex-row items-start justify-between mb-1">
            <Text className="text-text-primary text-base font-semibold flex-1 pr-3">
              Sent to the room. That took something.
            </Text>
            <Pressable onPress={() => setJustPosted(false)} hitSlop={12}>
              <Text className="text-text-muted text-base">✕</Text>
            </Pressable>
          </View>
          <Text className="text-text-secondary text-sm leading-relaxed mb-4">
            Replies will come. And if you'd rather have an actual conversation
            right now, that's here too:
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
        ListHeaderComponent={
          posts.length > 0 ? (
            <View className="flex-row items-center gap-2 mb-3 mt-1 px-1">
              <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(236,233,241,0.1)' }} />
              <Text style={{ fontFamily: MONO, fontSize: 11, color: '#817B91', letterSpacing: 1 }}>the room</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(236,233,241,0.1)' }} />
            </View>
          ) : null
        }
        renderItem={({ item, index }) => {
          const named = !item.is_anonymous;
          const handle = named ? `@${(item as any).username ?? 'member'}` : 'anon';
          const reactions = (item.reactions as Record<string, number>) ?? {};
          const mineActions = item.user_id !== myUserId && !(item as any).is_official;
          // Chosen status of the poster (named only; null until they set one
          // or before the presence migration is applied).
          const posterStatus = named ? ((item as any).poster_status as PresenceStatus | null) : null;
          const dotColor = posterStatus ? PRESENCE[posterStatus].dot : named ? ONLINE : '#5c5668';
          return (
            <Animated.View
              entering={FadeInDown.duration(300).delay(index * 30).springify()}
              className="mb-4 flex-row gap-2.5"
            >
              <View className="pt-1">
                <Avatar username={item.is_anonymous ? 'A' : (item as any).username} size="sm" />
              </View>
              <View className="flex-1">
                {/* Handle line — monospace, with a little presence bullet. */}
                <View className="flex-row items-center gap-1.5 mb-1">
                  <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: dotColor }} />
                  <Text style={{ fontFamily: MONO, fontSize: 12.5, color: named ? PLUM : '#9089a0' }} numberOfLines={1}>
                    {handle}
                  </Text>
                  {posterStatus ? (
                    <Text style={{ fontFamily: MONO, fontSize: 10.5, color: '#6f6980' }}>{PRESENCE[posterStatus].short}</Text>
                  ) : null}
                  {(item as any).is_official ? <RoleBadge role="official" /> : null}
                  <Text style={{ fontFamily: MONO, fontSize: 11, color: '#6f6980' }}>· {ago(item.created_at)}</Text>
                  {mineActions && (
                    <Pressable onPress={() => showPostActions(item)} hitSlop={12} className="ml-auto">
                      <Text className="text-text-muted text-lg">⋯</Text>
                    </Pressable>
                  )}
                </View>

                {/* Speech bubble — squared top-left corner points back to the avatar. */}
                <View
                  style={{
                    backgroundColor: '#403a4d',
                    borderRadius: 14,
                    borderTopLeftRadius: 4,
                    borderWidth: 1,
                    borderColor: 'rgba(236,233,241,0.07)',
                    paddingHorizontal: 14,
                    paddingVertical: 11,
                  }}
                >
                  <Text className="text-text-primary text-base leading-relaxed">{item.content}</Text>
                </View>

                {/* Reactions + comment toggle, chat-style under the bubble. */}
                <View className="flex-row flex-wrap items-center gap-2 mt-2">
                  {REACTIONS.map(({ key, emoji }) => {
                    const count = reactions[key] ?? 0;
                    const active = (item as any).my_reaction === key;
                    const locked = (item as any).is_seed_content || item.user_id === myUserId;
                    return (
                      <Pressable
                        key={key}
                        disabled={locked || active}
                        onPress={async () => {
                          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          react({ postId: item.id, reaction: key, currentReactions: reactions, currentReaction: (item as any).my_reaction }, {
                            onError: () => Alert.alert('Could not react', 'Please try again.'),
                          });
                        }}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 5,
                          paddingHorizontal: 9,
                          paddingVertical: 5,
                          borderRadius: 20,
                          backgroundColor: active ? 'rgba(164,137,222,0.22)' : 'rgba(255,255,255,0.05)',
                          borderWidth: 1,
                          borderColor: active ? 'rgba(164,137,222,0.5)' : 'transparent',
                          opacity: locked ? 0.6 : 1,
                        }}
                      >
                        <Text style={{ fontSize: 14 }}>{emoji}</Text>
                        {count > 0 && <Text style={{ fontFamily: MONO, fontSize: 11, color: '#B2ACC0' }}>{count}</Text>}
                      </Pressable>
                    );
                  })}
                  <Pressable
                    disabled={(item as any).is_seed_content}
                    onPress={() => setOpenComments(openComments === item.id ? null : item.id)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 5,
                      paddingHorizontal: 9,
                      paddingVertical: 5,
                      borderRadius: 20,
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      opacity: (item as any).is_seed_content ? 0.6 : 1,
                    }}
                  >
                    <Text style={{ fontFamily: MONO, fontSize: 11.5, color: '#B2ACC0' }}>↳ replies</Text>
                    {((item as any).comment_count ?? 0) > 0 && (
                      <Text style={{ fontFamily: MONO, fontSize: 11, color: '#817B91' }}>{(item as any).comment_count}</Text>
                    )}
                  </Pressable>
                  {mineActions && (
                    <Pressable onPress={() => showReportReasons(item.id)} hitSlop={8} className="ml-auto">
                      <Text style={{ fontFamily: MONO, fontSize: 10.5, color: '#6f6980' }}>report</Text>
                    </Pressable>
                  )}
                </View>

                {openComments === item.id && (() => {
                  const postComments = comments.filter((comment) => comment.post_id === item.id);
                  const mine = postComments.filter((comment) => comment.user_id === myUserId).length;
                  const atLimit = mine >= 3;
                  const draft = commentDrafts[item.id] ?? '';
                  return (
                    <View style={{ marginTop: 10, marginLeft: 4, paddingLeft: 12, borderLeftWidth: 2, borderLeftColor: 'rgba(164,137,222,0.25)' }}>
                      {commentsError && (
                        <Pressable onPress={() => refetchComments()} className="mb-3">
                          <Text className="text-danger text-sm">Replies couldn't load. Tap to retry.</Text>
                        </Pressable>
                      )}
                      {postComments.map((comment) => (
                        <View key={comment.id} className="flex-row gap-2 mb-3">
                          <Avatar username={comment.username} size="sm" />
                          <View className="flex-1">
                            <View className="flex-row items-center gap-1.5">
                              <Text style={{ fontFamily: MONO, fontSize: 11.5, color: PLUM }}>@{comment.username}</Text>
                              <Text style={{ fontFamily: MONO, fontSize: 10.5, color: '#6f6980' }}>· {ago(comment.created_at)}</Text>
                            </View>
                            <Text className="text-text-primary text-sm leading-relaxed mt-0.5">{comment.content}</Text>
                          </View>
                        </View>
                      ))}
                      {atLimit ? (
                        <Text className="text-text-muted text-sm mb-1">You've reached the 3-reply limit for this post.</Text>
                      ) : (
                        <View className="flex-row items-end gap-2 mt-1">
                          <TextInput value={draft} onChangeText={(text) => setCommentDrafts((current) => ({ ...current, [item.id]: text }))}
                            editable={!isSavingComment} placeholder="reply…" placeholderTextColor="#817B91" multiline maxLength={500}
                            className="flex-1 rounded-xl px-3 py-2 text-text-primary text-sm" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }} />
                          <Pressable disabled={!draft.trim() || isSavingComment} onPress={() => addComment({ postId: item.id, content: draft }, {
                            onSuccess: () => setCommentDrafts((current) => ({ ...current, [item.id]: '' })),
                            onError: (error) => Alert.alert('Could not reply', error instanceof Error ? error.message : 'Please try again.'),
                          })} style={{ borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: draft.trim() && !isSavingComment ? PLUM : '#474151' }}>
                            {isSavingComment ? <ActivityIndicator size="small" color="#ECE9F1" /> : <Text style={{ fontFamily: MONO, fontSize: 12, fontWeight: '700', color: draft.trim() ? '#201D28' : '#817B91' }}>SEND</Text>}
                          </Pressable>
                        </View>
                      )}
                    </View>
                  );
                })()}
              </View>
            </Animated.View>
          );
        }}
        ListFooterComponent={
          isFetchingNextPage ? (
            <ActivityIndicator size="small" color="#B2ACC0" className="mt-4" />
          ) : null
        }
        ListEmptyComponent={
          <View className="py-12 items-center px-6">
            <Text style={{ fontFamily: MONO, fontSize: 13, color: '#817B91', textAlign: 'center', lineHeight: 22 }}>
              {isError ? '// the room could not load' : '// the room is quiet…'}{'\n'}
              {!isError && 'bad day, good day, day one, day ninety —'}{'\n'}
              {!isError && 'be the first to break the silence.'}
            </Text>
            {isError && <Pressable onPress={() => refetch()} className="mt-4 bg-surface-2 rounded-xl px-4 py-2"><Text className="text-text-secondary text-sm">Try again</Text></Pressable>}
          </View>
        }
      />
    </View>
  );
}
