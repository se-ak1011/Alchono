import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAiCoach } from '@/hooks/useAiCoach';
import type { ChatMessage } from '@/types';

interface AiCoachChatProps {
  sessionType?: string;
}

// "What do you need right now?" — one tap to open the conversation, so the user
// never faces a blank box in a hard moment.
const QUICK_ACTIONS: { label: string; message: string; urge?: boolean }[] = [
  {
    label: 'I want a drink',
    message: "I want a drink right now. I need help getting through it.",
    urge: true,
  },
  { label: 'I drank today', message: 'I drank today and I want to talk about it.' },
  { label: 'I nearly drank', message: 'I nearly drank just now, but I didn’t.' },
  { label: 'I feel overwhelmed', message: 'I feel overwhelmed right now.' },
  { label: "I don't know what's wrong", message: "I don't know what's wrong, I just feel off." },
  { label: 'Just talk to me', message: 'Can we just talk for a bit?' },
];

export function AiCoachChat({ sessionType = 'general' }: AiCoachChatProps) {
  const router = useRouter();
  const { messages, isTyping, sendMessage } = useAiCoach(sessionType);
  const [input, setInput] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const insets = useSafeAreaInsets();

  // Show the openers only before the conversation has really started
  // (just the assistant's greeting present).
  const showQuickActions = messages.length <= 1;

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isTyping) return;
    setInput('');
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await sendMessage(text);
  };

  const handleUrge = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    sendMessage("I want a drink right now. I need help getting through it.");
    router.push('/session/urge');
  };

  const handleQuickAction = async (action: (typeof QUICK_ACTIONS)[number]) => {
    if (action.urge) {
      handleUrge();
      return;
    }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    sendMessage(action.message);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
      keyboardVerticalOffset={insets.bottom + 90}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => <ChatBubble message={item} />}
        ListHeaderComponent={
          showQuickActions ? (
            <View className="pt-2 pb-1 items-center">
              <Image
                source={require('../../../assets/companions/image_02_armchair.png')}
                style={{ width: 152, height: 179, opacity: 0.7 }}
                resizeMode="contain"
              />
            </View>
          ) : null
        }
        ListFooterComponent={
          isTyping ? (
            <View className="flex-row justify-start mb-3">
              <View className="bg-surface rounded-2xl rounded-tl-sm px-4 py-3 max-w-xs">
                <Text className="text-text-secondary text-lg">···</Text>
              </View>
            </View>
          ) : null
        }
      />

      {showQuickActions ? (
        /* Openers — one tap to start, so there's never a blank box to fill */
        <View className="px-4 mb-2">
          <Text className="text-text-muted text-sm font-medium mb-2.5 px-1">
            What do you need right now?
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {QUICK_ACTIONS.map((a) => (
              <Pressable
                key={a.label}
                onPress={() => handleQuickAction(a)}
                disabled={isTyping}
                className={`px-4 py-2.5 rounded-full border ${
                  a.urge
                    ? 'bg-urge-surface border-white/15 active:border-white/35'
                    : 'bg-surface border-white/10 active:border-white/25'
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    a.urge ? 'text-text-primary' : 'text-text-secondary'
                  }`}
                >
                  {a.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : (
        /* Once talking, keep the urge escape hatch always one tap away */
        <Pressable
          onPress={handleUrge}
          className="mx-4 mb-2 flex-row items-center justify-between bg-urge-surface rounded-xl px-5 py-4 border border-white/10 active:border-white/25"
          style={{
            shadowColor: '#120D17',
            shadowOpacity: 0.8,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 5 },
          }}
        >
          <Text className="text-text-primary text-base font-medium">
            I want a drink right now
          </Text>
          <Text className="text-text-muted text-sm">→</Text>
        </Pressable>
      )}

      <View
        className="flex-row items-end gap-3 px-4 py-3 border-t border-white/5 bg-bg"
        style={{ paddingBottom: Math.max(insets.bottom, 8) }}
      >
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Say something…"
          placeholderTextColor="#5E6472"
          multiline
          maxLength={500}
          onSubmitEditing={handleSend}
          returnKeyType="send"
          blurOnSubmit
          className="flex-1 bg-surface rounded-2xl px-4 py-3.5 text-text-primary text-base max-h-28"
          selectionColor="#9CA3AF"
        />
        <Pressable
          onPress={handleSend}
          disabled={!input.trim() || isTyping}
          className={`w-12 h-12 rounded-full items-center justify-center ${
            input.trim() && !isTyping
              ? 'bg-accent active:bg-accent-dark'
              : 'bg-surface-2'
          }`}
        >
          <Text className="text-white text-lg">↑</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';

  return (
    <Animated.View
      entering={FadeInDown.duration(300).springify()}
      className={`flex-row mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <View
        className={`max-w-xs px-4 py-3.5 rounded-2xl ${
          isUser
            ? 'bg-accent rounded-tr-sm'
            : 'bg-surface rounded-tl-sm'
        }`}
      >
        <Text
          className={`text-base leading-relaxed ${
            isUser ? 'text-white' : 'text-text-primary'
          }`}
        >
          {message.content}
        </Text>
      </View>
    </Animated.View>
  );
}
