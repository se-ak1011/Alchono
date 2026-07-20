import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeArea } from '@/components/ui/SafeArea';
import { headingShadow } from '@/styles';
import {
  useWriteLetter,
  DELIVERY_OPTIONS,
  type DeliveryChoice,
} from '@/hooks/useLetters';

const PROMPTS = [
  'Why did you stop drinking?',
  'What are you proud of today?',
  "What are you scared you'll forget?",
  'If today was hard, what helped?',
  'What do you hope life looks like when this appears again?',
];

export default function WriteLetterScreen() {
  const router = useRouter();
  const [body, setBody] = useState('');
  const [choice, setChoice] = useState<DeliveryChoice | null>(null);
  const { mutate: write, isPending } = useWriteLetter();

  const addPrompt = (p: string) => {
    setBody((prev) => (prev.trim() ? `${prev.trim()}\n\n${p}\n` : `${p}\n`));
  };

  const canSend = body.trim().length > 0 && !!choice && !isPending;

  const handleSend = () => {
    if (!canSend || !choice) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    write(
      { body, choice },
      {
        onSuccess: () => {
          Alert.alert(
            'Sealed.',
            "Future You will hear from you when the time comes — you won't know exactly when.",
            [{ text: 'Okay', onPress: () => router.back() }],
          );
        },
        onError: () => Alert.alert('Could not save', 'Please try again in a moment.'),
      },
    );
  };

  return (
    <SafeArea>
      <View className="px-6 pt-4 pb-2 flex-row justify-between items-center">
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text className="text-text-muted text-base">Close</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={90}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="px-6 pt-2">
            <Text
              className="text-text-primary text-4xl font-semibold tracking-tight"
              style={headingShadow}
            >
              Write to{'\n'}Future You.
            </Text>
            <Text className="text-text-secondary text-lg mt-3 leading-relaxed">
              What do you hope they remember?
            </Text>
          </View>

          {/* Optional prompts — tap to add one, or ignore them entirely */}
          <View className="px-6 mt-6">
            <Text className="text-text-muted text-xs font-medium tracking-widest uppercase mb-2.5">
              Need a starting point?
            </Text>
            <View className="gap-2">
              {PROMPTS.map((p) => (
                <Pressable
                  key={p}
                  onPress={() => addPrompt(p)}
                  className="bg-surface rounded-xl px-4 py-3 border border-white/5 active:border-white/20"
                >
                  <Text className="text-text-secondary text-sm leading-relaxed">{p}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Free editor */}
          <View className="px-6 mt-6">
            <TextInput
              value={body}
              onChangeText={setBody}
              placeholder="Or just write whatever you want them to know…"
              placeholderTextColor="#8E8798"
              multiline
              maxLength={4000}
              className="bg-surface rounded-2xl px-4 py-4 text-text-primary text-base leading-relaxed border border-white/8 min-h-[180px]"
              selectionColor="#9B82D0"
              textAlignVertical="top"
            />
          </View>

          {/* Delivery */}
          <View className="px-6 mt-7">
            <Text className="text-text-primary text-lg font-semibold mb-1">
              When should Future You receive this?
            </Text>
            <Text className="text-text-muted text-sm mb-4">
              Surprise picks a random moment in the next year.
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {DELIVERY_OPTIONS.map((o) => {
                const active = choice === o.key;
                return (
                  <Pressable
                    key={o.key}
                    onPress={() => setChoice(o.key)}
                    className={`px-4 py-2.5 rounded-full border ${
                      active
                        ? 'bg-surface-2 border-accent'
                        : 'bg-surface border-white/10 active:border-white/25'
                    }`}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        active ? 'text-text-primary' : 'text-text-secondary'
                      }`}
                    >
                      {o.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View className="px-6 mt-8">
            <Pressable
              onPress={handleSend}
              disabled={!canSend}
              className={`rounded-2xl py-4 items-center ${
                canSend ? 'bg-accent active:bg-accent-dark' : 'bg-surface-2'
              }`}
            >
              {isPending ? (
                <ActivityIndicator size="small" color="#15141A" />
              ) : (
                <Text
                  className={`text-base font-semibold ${
                    canSend ? 'text-bg' : 'text-text-muted'
                  }`}
                >
                  Seal this letter
                </Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeArea>
  );
}
