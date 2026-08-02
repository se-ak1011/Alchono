import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import {
  useThreadMessages,
  useSendMessage,
  useMarkThreadRead,
  useBlockUser,
  useReportUser,
} from '@/hooks/useMessages';
import {
  useDmMessages,
  useSendDmMessage,
  useMarkDmThreadRead,
  useDmThreadMeta,
  useDmPeerCity,
  useRespondToDmRequest,
  DM_REQUEST_LIMIT,
} from '@/hooks/useDirectMessages';
import { usePresences } from '@/hooks/usePresence';
import { PRESENCE } from '@/lib/presence';
import { REPORT_REASONS } from '@/types';
import type { Message } from '@/types';

const MONO = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }) as string;
const MINE_COLOR = '#8EC5E6'; // classic messenger blue for your own lines
const THEM_COLOR = '#E6A6C0'; // a warm rose for theirs

export default function ThreadScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { requestId, username, otherUserId, type } = useLocalSearchParams<{
    requestId: string;
    username?: string;
    otherUserId?: string;
    type?: string;
  }>();
  const userId = useAuthStore((s) => s.user?.id);
  const myUsername = useAuthStore((s) => s.profile?.username) ?? 'You';
  const isDm = type === 'dm';

  // Both hook families no-op when their id is undefined.
  const mentorMessages = useThreadMessages(isDm ? undefined : requestId);
  const dmMessages = useDmMessages(isDm ? requestId : undefined);
  const { mutate: sendMentor, isPending: sendingMentor } = useSendMessage(
    isDm ? undefined : requestId,
  );
  const { mutate: sendDm, isPending: sendingDm } = useSendDmMessage(
    isDm ? requestId : undefined,
  );
  const { mutate: markMentorRead } = useMarkThreadRead(isDm ? undefined : requestId);
  const { mutate: markDmRead } = useMarkDmThreadRead(isDm ? requestId : undefined);
  const { data: dmThread } = useDmThreadMeta(isDm ? requestId : undefined);
  const { data: peerCity } = useDmPeerCity(
    isDm ? requestId : undefined,
    dmThread?.status === 'accepted',
  );
  const { mutate: respondDm, isPending: respondingDm } = useRespondToDmRequest();
  const { mutate: blockUser } = useBlockUser();
  const { mutate: reportUser } = useReportUser();
  const { data: presences } = usePresences(otherUserId ? [otherUserId] : []);
  const peer = otherUserId ? presences?.[otherUserId] : undefined;

  const messages = (isDm ? dmMessages.data : mentorMessages.data) as
    | Message[]
    | undefined;
  const send = isDm ? sendDm : sendMentor;
  const isSending = isDm ? sendingDm : sendingMentor;
  const markRead = isDm ? markDmRead : markMentorRead;

  // Request-model state (DM only)
  const dmPending = isDm && dmThread?.status === 'pending';
  const dmDeclined = isDm && dmThread?.status === 'declined';
  const iAmDmRequester = isDm && dmThread?.requester_id === userId;
  const myPendingSent = dmPending
    ? (messages ?? []).filter((m) => m.sender_id === userId).length
    : 0;
  const requestExhausted = dmPending && iAmDmRequester && myPendingSent >= DM_REQUEST_LIMIT;
  const composerLocked =
    dmDeclined || (dmPending && !iAmDmRequester) || requestExhausted;

  const [draft, setDraft] = useState('');
  const listRef = useRef<FlatList>(null);

  // Mark incoming messages read whenever the thread is open and updates.
  useEffect(() => {
    if (messages?.some((m) => m.sender_id !== userId && !m.read_at)) {
      markRead();
    }
  }, [messages?.length]);

  const handleSend = () => {
    const content = draft.trim();
    if (!content || isSending) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDraft('');
    send(content, {
      onError: (e) => {
        setDraft(content);
        Alert.alert('Not sent', e instanceof Error ? e.message : 'Please try again.');
      },
    });
  };

  const handleReport = () => {
    Alert.alert(
      'Report this person?',
      'Our team reviews every report. The other person is not told who reported them.',
      [
        { text: 'Cancel', style: 'cancel' },
        ...REPORT_REASONS.map((reason) => ({
          text: reason,
          onPress: () => {
            if (!otherUserId) return;
            reportUser(
              {
                reportedUserId: otherUserId,
                requestId: isDm ? undefined : requestId,
                reason: isDm ? `[dm thread ${requestId}] ${reason}` : reason,
              },
              {
                onSuccess: () => Alert.alert('Reported', 'Thank you. We will look into it.'),
                onError: () => Alert.alert('Error', 'Could not send the report.'),
              },
            );
          },
        })),
      ],
    );
  };

  const handleBlock = () => {
    Alert.alert(
      `Block ${username ?? 'this person'}?`,
      'Neither of you will be able to message the other. This conversation stays visible but closed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: () => {
            if (!otherUserId) return;
            blockUser(otherUserId, {
              onSuccess: () => router.back(),
              onError: () => Alert.alert('Error', 'Could not block. Try again.'),
            });
          },
        },
      ],
    );
  };

  const showActions = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(username ?? 'Options', undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Report', onPress: handleReport },
      { text: 'Block', style: 'destructive', onPress: handleBlock },
    ]);
  };

  // MSN transcript line: "Name says: (10:32)" then the message underneath.
  const renderMessage = ({ item }: { item: Message }) => {
    const mine = item.sender_id === userId;
    const name = mine ? myUsername : username ?? 'Them';
    const time = new Date(item.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    return (
      <View style={{ paddingHorizontal: 18, marginBottom: 11 }}>
        <Text style={{ fontFamily: MONO, fontSize: 12 }}>
          <Text style={{ color: mine ? MINE_COLOR : THEM_COLOR, fontWeight: '700' }}>{name} </Text>
          <Text style={{ color: '#6f6980' }}>says: ({time})</Text>
        </Text>
        <Text style={{ color: '#ECE9F1', fontSize: 15, lineHeight: 21, marginTop: 2 }}>{item.content}</Text>
      </View>
    );
  };

  const statusLabel = peer ? PRESENCE[peer.status].label : null;
  const statusDot = peer ? PRESENCE[peer.status].dot : '#5c5668';
  const subParts = [statusLabel, peerCity ? `near ${peerCity}` : null, peer?.statusMessage ? `“${peer.statusMessage}”` : null].filter(Boolean);

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-bg">
      <View className="flex-1" style={{ paddingTop: insets.top }}>
        {/* MSN window title bar */}
        <View className="flex-row items-center px-4 py-3" style={{ backgroundColor: '#2b2635', borderBottomWidth: 1, borderBottomColor: 'rgba(164,137,222,0.25)' }}>
          <Pressable onPress={() => router.back()} className="mr-3" hitSlop={12}>
            <Text style={{ color: '#B2ACC0', fontSize: 18 }}>‹</Text>
          </Pressable>
          <View>
            <Avatar username={username} size="sm" />
            <View style={{ position: 'absolute', right: -2, bottom: -2, width: 11, height: 11, borderRadius: 6, backgroundColor: statusDot, borderWidth: 2, borderColor: '#2b2635' }} />
          </View>
          <View className="ml-3 flex-1">
            <Text style={{ color: '#ECE9F1', fontSize: 15, fontWeight: '700' }} numberOfLines={1}>
              {username ?? 'Conversation'}
            </Text>
            {subParts.length > 0 && (
              <Text style={{ fontFamily: MONO, fontSize: 11, color: '#817B91' }} numberOfLines={1}>
                {subParts.join(' · ')}
              </Text>
            )}
          </View>
          <Pressable onPress={showActions} hitSlop={12}>
            <Text style={{ color: '#817B91', fontSize: 20 }}>⋯</Text>
          </Pressable>
        </View>

        {/* DM request banner — recipient decides right here too */}
        {dmPending && !iAmDmRequester && (
          <View className="mx-4 mt-3 rounded-2xl px-5 py-4" style={{ backgroundColor: '#2b2635', borderWidth: 1, borderColor: 'rgba(164,137,222,0.3)' }}>
            <Text className="text-text-primary text-base font-semibold mb-1">Message request</Text>
            <Text className="text-text-muted text-sm leading-relaxed mb-3">
              {username ?? 'This member'} can't send more messages unless you accept. Block and report are in the ⋯ menu.
            </Text>
            <View className="flex-row gap-2">
              <Button title="Decline" variant="secondary" size="sm" className="flex-1" disabled={respondingDm}
                onPress={() => respondDm({ threadId: requestId!, accept: false })} />
              <Button title="Accept" variant="primary" size="sm" className="flex-1" disabled={respondingDm}
                onPress={() => respondDm({ threadId: requestId!, accept: true })} />
            </View>
          </View>
        )}

        <FlatList
          ref={listRef}
          data={messages ?? []}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          keyExtractor={(m) => m.id}
          renderItem={renderMessage}
          contentContainerStyle={{ paddingVertical: 16, flexGrow: 1 }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center px-10">
              <Text style={{ fontFamily: MONO, fontSize: 13, color: '#817B91', textAlign: 'center', lineHeight: 21 }}>
                {dmPending && iAmDmRequester
                  ? `// message request\nyou can send up to ${DM_REQUEST_LIMIT} messages\nuntil they accept.`
                  : '// private window — just the two of you\nsay hi.'}
              </Text>
            </View>
          }
        />

        {/* Request-model composer states */}
        {dmPending && iAmDmRequester && (
          <Text style={{ fontFamily: MONO, fontSize: 11, color: '#817B91', textAlign: 'center', paddingBottom: 4 }}>
            {requestExhausted
              ? `request sent — ${DM_REQUEST_LIMIT}/${DM_REQUEST_LIMIT} used · waiting for them to accept`
              : `message request · ${myPendingSent}/${DM_REQUEST_LIMIT} sent`}
          </Text>
        )}
        {dmDeclined && (
          <Text style={{ fontFamily: MONO, fontSize: 11, color: '#817B91', textAlign: 'center', paddingBottom: 4 }}>
            this request was declined. no more messages can be sent.
          </Text>
        )}

        {/* MSN composer */}
        <View
          className="flex-row items-end gap-2 px-4 pt-3"
          style={{ paddingBottom: insets.bottom + 8, borderTopWidth: 1, borderTopColor: 'rgba(164,137,222,0.2)', backgroundColor: '#2b2635', opacity: composerLocked ? 0.5 : 1 }}
        >
          {/* Ghosted nudge — the buzz is coming later 😏 */}
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); Alert.alert('Nudge', 'The window-shaking buzz is coming soon 😏'); }}
            disabled={composerLocked}
            className="w-10 h-10 rounded-lg items-center justify-center active:opacity-60"
            style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(236,233,241,0.12)' }}
          >
            <Text style={{ fontSize: 15 }}>👋</Text>
          </Pressable>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder={composerLocked ? 'Messaging is closed on this thread' : 'Write a message…'}
            placeholderTextColor="#817B91"
            multiline
            editable={!composerLocked}
            maxLength={2000}
            style={{
              flex: 1,
              backgroundColor: 'rgba(255,255,255,0.06)',
              borderRadius: 10,
              paddingHorizontal: 14,
              paddingTop: 11,
              paddingBottom: 11,
              color: '#ECE9F1',
              fontSize: 15,
              maxHeight: 120,
              borderWidth: 1,
              borderColor: 'rgba(243, 240, 244, 0.12)',
            }}
          />
          <Pressable
            onPress={handleSend}
            disabled={!draft.trim() || isSending || composerLocked}
            className="h-10 px-4 rounded-lg items-center justify-center"
            style={{ backgroundColor: draft.trim() && !composerLocked ? '#A489DE' : '#474151' }}
          >
            <Text style={{ fontFamily: MONO, fontSize: 13, fontWeight: '700', letterSpacing: 1, color: draft.trim() && !composerLocked ? '#201D28' : '#817B91' }}>SEND</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
