import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  KeyboardAvoidingView,
  Platform,
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

export function AiCoachChat({ sessionType = 'general' }: AiCoachChatProps) {
  const router = useRouter();
  const { messages, isTyping, sendMessage } = useAiCoach(sessionType);
  const [input, setInput] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const insets = useSafeAreaInsets();

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
    sendMessage("I'm having an urge to drink right now. I need help getting through it.");
    router.push('/session/urge');
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
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => <ChatBubble message={item} />}
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

      {/* Urge quick-action — always visible, above input */}
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
          I'm having an urge right now
        </Text>
        <Text className="text-text-muted text-sm">→</Text>
      </Pressable>

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
