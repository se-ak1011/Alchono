import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { SafeArea } from '@/components/ui/SafeArea';
import { ZoneGlow } from '@/components/ui/ZoneGlow';
import { useAddTextNote } from '@/hooks/useJournalNotes';
import { headingShadow } from '@/styles';

/**
 * A note — the text-compose surface, lifted out of the Writing Room launcher
 * onto its own screen so the room can be a calm companion + chips.
 */
export default function WriteNoteScreen() {
  const router = useRouter();
  const [draft, setDraft] = useState('');
  const { mutate: addText, isPending } = useAddTextNote();

  const save = () => {
    if (!draft.trim() || isPending) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addText(draft, {
      onSuccess: () => router.back(),
      onError: (e) =>
        Alert.alert('Could not save', e instanceof Error ? e.message : 'Try again.'),
    });
  };

  return (
    <SafeArea bottom={false}>
      <ZoneGlow zone="writing" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={90}
      >
        <View className="px-6 pt-5 pb-3 flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <Pressable onPress={() => router.back()} hitSlop={12} className="p-1 -ml-1 active:opacity-60">
              <Feather name="chevron-left" size={26} color="#B2ACC0" />
            </Pressable>
            <Text className="text-text-primary text-3xl tracking-tight" style={headingShadow}>
              A note
            </Text>
          </View>
          <Pressable
            onPress={save}
            disabled={!draft.trim() || isPending}
            className={`px-5 py-2.5 rounded-xl ${draft.trim() && !isPending ? 'bg-accent' : 'bg-surface-2'}`}
          >
            {isPending ? (
              <ActivityIndicator size="small" color="#ECE9F1" />
            ) : (
              <Text className={`text-sm font-semibold ${draft.trim() ? 'text-bg' : 'text-text-muted'}`}>
                Save
              </Text>
            )}
          </Pressable>
        </View>

        <View className="mx-6 mt-1 flex-1 bg-surface rounded-2xl p-4 border border-white/8">
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="What's on your mind? Tap the mic on your keyboard to just talk…"
            placeholderTextColor="#817B91"
            multiline
            autoFocus
            maxLength={2000}
            className="text-text-primary text-base leading-relaxed flex-1"
            style={{ textAlignVertical: 'top' }}
            selectionColor="#B2ACC0"
          />
        </View>
        <View className="h-6" />
      </KeyboardAvoidingView>
    </SafeArea>
  );
}
