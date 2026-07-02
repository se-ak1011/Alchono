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
import { useAuthStore } from '@/store/authStore';
import {
  useThreadMessages,
  useSendMessage,
  useMarkThreadRead,
  useBlockUser,
  useReportUser,
} from '@/hooks/useMessages';
import { REPORT_REASONS } from '@/types';
import type { Message } from '@/types';

export default function ThreadScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { requestId, username, otherUserId } = useLocalSearchParams<{
    requestId: string;
    username?: string;
    otherUserId?: string;
  }>();
  const userId = useAuthStore((s) => s.user?.id);

  const { data: messages } = useThreadMessages(requestId);
  const { mutate: send, isPending: isSending } = useSendMessage(requestId);
  const { mutate: markRead } = useMarkThreadRead(requestId);
  const { mutate: blockUser } = useBlockUser();
  const { mutate: reportUser } = useReportUser();

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
              { reportedUserId: otherUserId, requestId, reason },
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
          <Text className="text-text-primary text-base font-semibold ml-3 flex-1">
            {username ?? 'Conversation'}
          </Text>
          <Pressable onPress={showActions} hitSlop={12}>
            <Text className="text-text-muted text-xl">⋯</Text>
          </Pressable>
        </View>

        <FlatList
          ref={listRef}
          data={messages ?? []}
          keyExtractor={(m) => m.id}
          renderItem={renderMessage}
          contentContainerStyle={{ paddingVertical: 16, flexGrow: 1 }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center px-10">
              <Text className="text-text-muted text-base text-center leading-relaxed">
                This space is private — just the two of you.{'\n'}Say hi.
              </Text>
            </View>
          }
        />

        {/* Composer */}
        <View
          className="flex-row items-end gap-2 px-4 pt-3 border-t border-white/5"
          style={{ paddingBottom: insets.bottom + 8 }}
        >
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Write a message…"
            placeholderTextColor="#5E6472"
            multiline
            maxLength={2000}
            style={{
              flex: 1,
              backgroundColor: '#161718',
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingTop: 12,
              paddingBottom: 12,
              color: '#F0F2F4',
              fontSize: 16,
              maxHeight: 120,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.08)',
            }}
          />
          <Pressable
            onPress={handleSend}
            disabled={!draft.trim() || isSending}
            className={`w-11 h-11 rounded-full items-center justify-center ${
              draft.trim() ? 'bg-accent' : 'bg-surface-2'
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
