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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { PaperBackground } from '@/components/ui/PaperBackground';
import { useAddTextNote } from '@/hooks/useJournalNotes';

const INK = '#332a24';
const INK_SOFT = 'rgba(51,42,36,0.4)';

/**
 * A note — written in ink on the notebook page. Text-compose surface, lifted
 * out of the Writing Room launcher onto its own paper.
 */
export default function WriteNoteScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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

  const canSave = !!draft.trim() && !isPending;

  return (
    <PaperBackground>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, paddingTop: insets.top }}
        keyboardVerticalOffset={0}
      >
        <View style={{ paddingHorizontal: 22, paddingTop: 8, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Pressable onPress={() => router.back()} hitSlop={12} className="active:opacity-60">
              <Feather name="chevron-left" size={26} color={INK} />
            </Pressable>
            <Text style={{ fontFamily: 'PatrickHand', fontSize: 30, color: INK }}>A note</Text>
          </View>
          <Pressable
            onPress={save}
            disabled={!canSave}
            style={{ paddingHorizontal: 18, paddingVertical: 9, borderRadius: 16, backgroundColor: canSave ? '#A489DE' : 'rgba(51,42,36,0.12)' }}
          >
            {isPending ? (
              <ActivityIndicator size="small" color="#201D28" />
            ) : (
              <Text style={{ fontSize: 14, fontWeight: '700', color: canSave ? '#201D28' : INK_SOFT }}>Save</Text>
            )}
          </Pressable>
        </View>

        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="What's on your mind? Tap the mic on your keyboard to just talk…"
          placeholderTextColor={INK_SOFT}
          multiline
          autoFocus
          maxLength={2000}
          selectionColor="#A489DE"
          textAlignVertical="top"
          style={{ flex: 1, marginHorizontal: 30, marginTop: 4, color: INK, fontFamily: 'PatrickHand', fontSize: 19, lineHeight: 26 }}
        />
        <View style={{ height: 24 }} />
      </KeyboardAvoidingView>
    </PaperBackground>
  );
}
