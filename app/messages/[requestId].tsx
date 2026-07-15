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
import { REPORT_REASONS } from '@/types';
import type { Message } from '@/types';

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
        Alert.alert(
          'Not sent',
          e instanceof Error ? e.message : 'Please try again.',
        );
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
              // reports.request_id has a FK to mentor_requests, so DM thread
              // context travels in the reason text instead.
              {
                reportedUserId: otherUserId,
                requestId: isDm ? undefined : requestId,
                reason: isDm ? `[dm thread ${requestId}] ${reason}` : reason,
              },
              {
                onSuccess: () =>
                  Alert.alert('Reported', 'Thank you. We will look into it.'),
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

  const renderMessage = ({ item }: { item: Message }) => {
    const mine = item.sender_id === userId;
    return (
      <View
        className={`px-6 mb-2 ${mine ? 'items-end' : 'items-start'}`}
      >
        <View
          className={`max-w-[80%] rounded-2xl px-4 py-3 ${
            mine ? 'bg-accent' : 'bg-surface border border-white/8'
          }`}
        >
          <Text className={`text-base leading-snug ${mine ? 'text-bg' : 'text-text-primary'}`}>
            {item.content}
          </Text>
        </View>
        <Text className="text-text-muted text-xs mt-1">
          {new Date(item.created_at).toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-bg"
    >
      <View className="flex-1" style={{ paddingTop: insets.top + 12 }}>
        {/* Header */}
        <View className="flex-row items-center px-6 pb-4 border-b border-white/5">
          <Pressable onPress={() => router.back()} className="mr-4" hitSlop={12}>
            <Text className="text-text-secondary text-lg">←</Text>
          </Pressable>
          <Avatar username={username} size="sm" />
          <View className="ml-3 flex-1">
            <Text className="text-text-primary text-base font-semibold">
              {username ?? 'Conversation'}
            </Text>
            {!!peerCity && (
              <Text className="text-text-muted text-xs mt-0.5">near {peerCity}</Text>
            )}
          </View>
          <Pressable onPress={showActions} hitSlop={12}>
            <Text className="text-text-muted text-xl">⋯</Text>
          </Pressable>
        </View>

        {/* DM request banner — recipient decides right here too */}
        {dmPending && !iAmDmRequester && (
          <View className="mx-4 mt-3 bg-surface rounded-2xl px-5 py-4 border border-white/10">
            <Text className="text-text-primary text-base font-semibold mb-1">
              Message request
            </Text>
            <Text className="text-text-muted text-sm leading-relaxed mb-3">
              {username ?? 'This member'} can't send more messages unless you
              accept. Block and report are in the ⋯ menu.
            </Text>
            <View className="flex-row gap-2">
              <Button
                title="Decline"
                variant="secondary"
                size="sm"
                className="flex-1"
                disabled={respondingDm}
                onPress={() => respondDm({ threadId: requestId!, accept: false })}
              />
              <Button
                title="Accept"
                variant="primary"
                size="sm"
                className="flex-1"
                disabled={respondingDm}
                onPress={() => respondDm({ threadId: requestId!, accept: true })}
              />
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
              <Text className="text-text-muted text-base text-center leading-relaxed">
                {dmPending && iAmDmRequester
                  ? `This is a message request.\nYou can send up to ${DM_REQUEST_LIMIT} messages until they accept.`
                  : 'This space is private — just the two of you.\nSay hi.'}
              </Text>
            </View>
          }
        />

        {/* Request-model composer states */}
        {dmPending && iAmDmRequester && (
          <Text className="text-text-muted text-xs text-center pb-1">
            {requestExhausted
              ? `Request sent — ${DM_REQUEST_LIMIT} of ${DM_REQUEST_LIMIT} messages used. Waiting for them to accept.`
              : `Message request · ${myPendingSent} of ${DM_REQUEST_LIMIT} sent`}
          </Text>
        )}
        {dmDeclined && (
          <Text className="text-text-muted text-xs text-center pb-1">
            This request was declined. No more messages can be sent.
          </Text>
        )}

        {/* Composer */}
        <View
          className="flex-row items-end gap-2 px-4 pt-3 border-t border-white/5"
          style={{
            paddingBottom: insets.bottom + 8,
            opacity: composerLocked ? 0.4 : 1,
          }}
        >
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder={
              composerLocked ? 'Messaging is closed on this thread' : 'Write a message…'
            }
            placeholderTextColor="#8E8798"
            multiline
            editable={!composerLocked}
            maxLength={2000}
            style={{
              flex: 1,
              backgroundColor: '#211E29',
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingTop: 12,
              paddingBottom: 12,
              color: '#F3F0F4',
              fontSize: 16,
              maxHeight: 120,
              borderWidth: 1,
              borderColor: 'rgba(243, 240, 244, 0.10)',
            }}
          />
          <Pressable
            onPress={handleSend}
            disabled={!draft.trim() || isSending || composerLocked}
            className={`w-11 h-11 rounded-full items-center justify-center ${
              draft.trim() && !composerLocked ? 'bg-accent' : 'bg-surface-2'
            }`}
          >
            <Text
              className={`text-lg font-bold ${draft.trim() ? 'text-bg' : 'text-text-muted'}`}
            >
              ↑
            </Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
