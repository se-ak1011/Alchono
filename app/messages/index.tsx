import React from 'react';
import { View, Text, ScrollView, Pressable, Platform } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import {
  useConnections,
  useMentorInbox,
  useRespondToRequest,
} from '@/hooks/useMessages';
import {
  useDmInbox,
  useRespondToDmRequest,
  useDmConnections,
} from '@/hooks/useDirectMessages';
import { usePresences, useMyStatus } from '@/hooks/usePresence';
import { PRESENCE, type PresenceStatus } from '@/lib/presence';
import { useAuthStore } from '@/store/authStore';

const MONO = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }) as string;
const PLUM = '#A489DE';

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

/**
 * Messages — an MSN Messenger buddy list. Your own status panel sits up top,
 * then contact requests, then your contacts grouped Online / Offline with a
 * coloured status dot and their status line. It's the same threads underneath
 * (mentor connections + accepted DMs, requests with the 3-message cap,
 * accept/decline, block/report) — dressed as the window you used to leave open
 * after school.
 */
type Conversation = {
  key: string;
  id: string;
  type: 'mentor' | 'dm';
  otherUserId: string;
  otherUsername: string;
  lastMessage?: { content: string; created_at: string } | null;
  unreadCount: number;
  emptyHint: string;
  sortDate: string;
};

function BuddyRow({ c, status, statusMessage, onPress }: {
  c: Conversation;
  status: PresenceStatus | null;
  statusMessage: string | null;
  onPress: () => void;
}) {
  const dot = status ? PRESENCE[status].dot : '#5c5668';
  const secondary = c.lastMessage?.content ?? statusMessage ?? c.emptyHint;
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 px-3 py-2.5 rounded-xl active:opacity-70"
      style={{ backgroundColor: c.unreadCount > 0 ? 'rgba(164,137,222,0.08)' : 'transparent' }}
    >
      <View>
        <Avatar username={c.otherUsername} size="md" />
        <View style={{ position: 'absolute', right: -1, bottom: -1, width: 12, height: 12, borderRadius: 6, backgroundColor: dot, borderWidth: 2, borderColor: '#201D28' }} />
      </View>
      <View className="flex-1">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2 flex-1 mr-2">
            <Text style={{ color: '#ECE9F1', fontSize: 15, fontWeight: '600' }} numberOfLines={1}>
              {c.otherUsername}
            </Text>
            {c.type === 'mentor' && (
              <Text style={{ fontFamily: MONO, fontSize: 10, color: '#817B91' }}>mentor</Text>
            )}
          </View>
          {c.lastMessage && (
            <Text style={{ fontFamily: MONO, fontSize: 10.5, color: '#6f6980' }}>{timeAgo(c.lastMessage.created_at)}</Text>
          )}
        </View>
        <View className="flex-row items-center justify-between mt-0.5">
          <Text
            style={{ fontSize: 13, flex: 1, marginRight: 8, color: c.unreadCount > 0 ? '#B2ACC0' : '#817B91' }}
            numberOfLines={1}
          >
            {secondary}
          </Text>
          {c.unreadCount > 0 && (
            <View style={{ minWidth: 20, height: 20, paddingHorizontal: 5, borderRadius: 10, backgroundColor: PLUM, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#201D28', fontSize: 11, fontWeight: '800' }}>{c.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

export default function MessagesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: connections, isLoading } = useConnections();
  const { data: inbox } = useMentorInbox();
  const { mutate: respond, isPending: isResponding } = useRespondToRequest();
  const { data: dmInbox } = useDmInbox();
  const { mutate: respondDm, isPending: isRespondingDm } = useRespondToDmRequest();
  const { data: dmConnections } = useDmConnections();

  const myUsername = useAuthStore((s) => s.profile?.username) ?? 'you';
  const myAvatar = useAuthStore((s) => (s.profile as any)?.avatar_url as string | null);
  const { status: myStatus, statusMessage: myStatusMessage } = useMyStatus();

  const allConversations: Conversation[] = [
    ...(connections ?? []).map((c) => ({
      key: `mentor-${c.requestId}`,
      id: c.requestId,
      type: 'mentor' as const,
      otherUserId: c.otherUserId,
      otherUsername: c.otherUsername,
      lastMessage: c.lastMessage,
      unreadCount: c.unreadCount,
      emptyHint: c.iAmMentor ? 'You accepted — say hi.' : 'Connected — say hi.',
      sortDate: c.lastMessage?.created_at ?? '',
    })),
    ...(dmConnections ?? []).map((c) => ({
      key: `dm-${c.threadId}`,
      id: c.threadId,
      type: 'dm' as const,
      otherUserId: c.otherUserId,
      otherUsername: c.otherUsername,
      lastMessage: c.lastMessage,
      unreadCount: c.unreadCount,
      emptyHint: 'Request accepted — say hi.',
      sortDate: c.lastMessage?.created_at ?? '',
    })),
  ].sort((a, b) => (b.sortDate > a.sortDate ? 1 : -1));

  const { data: presences } = usePresences(allConversations.map((c) => c.otherUserId));
  const statusOf = (id: string): PresenceStatus | null => presences?.[id]?.status ?? null;

  const online = allConversations.filter((c) => {
    const s = statusOf(c.otherUserId);
    return s && s !== 'offline';
  });
  const offline = allConversations.filter((c) => !online.includes(c));

  const openThread = (c: Conversation) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/messages/[requestId]',
      params: { requestId: c.id, type: c.type, username: c.otherUsername, otherUserId: c.otherUserId },
    } as any);
  };

  const Group = ({ title, items }: { title: string; items: Conversation[] }) =>
    items.length ? (
      <View className="mb-4">
        <Text style={{ fontFamily: MONO, fontSize: 11, color: '#817B91', letterSpacing: 1, marginBottom: 6, marginLeft: 4 }}>
          ▾ {title} ({items.length})
        </Text>
        {items.map((c, i) => (
          <Animated.View key={c.key} entering={FadeInDown.duration(300).delay(Math.min(i * 30, 240))}>
            <BuddyRow c={c} status={statusOf(c.otherUserId)} statusMessage={presences?.[c.otherUserId]?.statusMessage ?? null} onPress={() => openThread(c)} />
          </Animated.View>
        ))}
      </View>
    ) : null;

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      {/* Window title bar */}
      <View className="flex-row items-center gap-3 px-4 py-3" style={{ backgroundColor: '#2b2635', borderBottomWidth: 1, borderBottomColor: 'rgba(164,137,222,0.25)' }}>
        <Pressable onPress={() => router.back()} hitSlop={12} className="active:opacity-60">
          <Text style={{ color: '#B2ACC0', fontSize: 18 }}>‹</Text>
        </Pressable>
        <Text style={{ fontFamily: MONO, fontSize: 14, color: '#ECE9F1', letterSpacing: 1, flex: 1 }}>Messenger</Text>
        <Text style={{ fontFamily: MONO, fontSize: 12, color: '#6f6980' }}>◵ ◷ ✕</Text>
      </View>

      {/* Your own status panel, MSN-style */}
      <View className="flex-row items-center gap-3 px-4 py-3" style={{ backgroundColor: 'rgba(164,137,222,0.07)', borderBottomWidth: 1, borderBottomColor: 'rgba(236,233,241,0.08)' }}>
        <View>
          <Avatar username={myUsername} imageUrl={myAvatar} size="md" />
          <View style={{ position: 'absolute', right: -1, bottom: -1, width: 12, height: 12, borderRadius: 6, backgroundColor: PRESENCE[myStatus].dot, borderWidth: 2, borderColor: '#201D28' }} />
        </View>
        <View className="flex-1">
          <Text style={{ color: '#ECE9F1', fontSize: 15, fontWeight: '700' }} numberOfLines={1}>
            {myUsername} <Text style={{ fontFamily: MONO, fontSize: 12, color: '#817B91', fontWeight: '400' }}>({PRESENCE[myStatus].label})</Text>
          </Text>
          <Text style={{ color: '#9089a0', fontSize: 12.5, fontStyle: 'italic', marginTop: 1 }} numberOfLines={1}>
            {myStatusMessage ? `“${myStatusMessage}”` : 'set a status over in Community'}
          </Text>
        </View>
      </View>

      {isLoading ? (
        <LoadingSpinner message="Signing in…" />
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
          {/* Contact requests — mentors */}
          {!!inbox?.length && (
            <View className="mb-6">
              <Text style={{ fontFamily: MONO, fontSize: 11, color: PLUM, letterSpacing: 1, marginBottom: 8 }}>● wants to add you</Text>
              {inbox.map((req, i) => (
                <Animated.View key={req.id} entering={FadeInDown.duration(300).delay(i * 50)} className="rounded-2xl px-5 py-5 mb-3" style={{ backgroundColor: '#2b2635', borderWidth: 1, borderColor: 'rgba(164,137,222,0.3)' }}>
                  <View className="flex-row items-center gap-3 mb-3">
                    <Avatar username={req.requesterUsername} size="md" />
                    <View className="flex-1">
                      <Text className="text-text-primary text-base font-semibold">{req.requesterUsername}</Text>
                      <Text className="text-text-muted text-sm mt-0.5">wants to connect · {timeAgo(req.created_at)}</Text>
                    </View>
                  </View>
                  {req.message && <Text className="text-text-secondary text-base leading-relaxed mb-4">“{req.message}”</Text>}
                  <View className="flex-row gap-2">
                    <Button title="Decline" variant="secondary" size="sm" className="flex-1" disabled={isResponding}
                      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); respond({ requestId: req.id, accept: false }); }} />
                    <Button title="Accept" variant="primary" size="sm" className="flex-1" disabled={isResponding}
                      onPress={() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); respond({ requestId: req.id, accept: true }); }} />
                  </View>
                </Animated.View>
              ))}
            </View>
          )}

          {/* Contact requests — DMs (3-message cap) */}
          {!!dmInbox?.length && (
            <View className="mb-6">
              <Text style={{ fontFamily: MONO, fontSize: 11, color: PLUM, letterSpacing: 1, marginBottom: 8 }}>● wants to message you</Text>
              {dmInbox.map((req, i) => (
                <Animated.View key={req.id} entering={FadeInDown.duration(300).delay(i * 50)} className="rounded-2xl px-5 py-5 mb-3" style={{ backgroundColor: '#2b2635', borderWidth: 1, borderColor: 'rgba(164,137,222,0.3)' }}>
                  <View className="flex-row items-center gap-3 mb-3">
                    <Avatar username={req.requesterUsername} size="md" />
                    <View className="flex-1">
                      <Text className="text-text-primary text-base font-semibold">{req.requesterUsername}</Text>
                      <Text className="text-text-muted text-sm mt-0.5">wants to message you · {timeAgo(req.created_at)}</Text>
                    </View>
                  </View>
                  {req.previewMessages.length > 0 && (
                    <View className="rounded-xl px-4 py-3 mb-4" style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(236,233,241,0.07)' }}>
                      {req.previewMessages.map((m) => (
                        <Text key={m.id} className="text-text-secondary text-sm leading-relaxed">{m.content}</Text>
                      ))}
                    </View>
                  )}
                  <Text className="text-text-muted text-xs mb-3">They can't send more unless you accept. You can block or report them any time.</Text>
                  <View className="flex-row gap-2">
                    <Button title="Decline" variant="secondary" size="sm" className="flex-1" disabled={isRespondingDm}
                      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); respondDm({ threadId: req.id, accept: false }); }} />
                    <Button title="Accept" variant="primary" size="sm" className="flex-1" disabled={isRespondingDm}
                      onPress={() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); respondDm({ threadId: req.id, accept: true }); }} />
                  </View>
                </Animated.View>
              ))}
            </View>
          )}

          {/* Buddy list */}
          {allConversations.length ? (
            <>
              <Group title="Online" items={online} />
              <Group title="Offline" items={offline} />
            </>
          ) : (
            <View className="py-12 items-center px-6">
              <Text style={{ fontFamily: MONO, fontSize: 13, color: '#817B91', textAlign: 'center', lineHeight: 22 }}>
                // no contacts yet{'\n'}
                connect with a mentor, or send a message{'\n'}request from a community post.
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}
