import React, { useState } from 'react';
import { View, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { DrawnForm, FieldZone, TickZone, type Rect } from '@/components/paper/DrawnForm';
import { useAddTextNote } from '@/hooks/useJournalNotes';

/**
 * A note — written in ink on the drawn notebook page. Re-skinned onto the
 * hand-drawn writing paper as a DrawnForm close-up: the body field and the save
 * tap are positionable in the pencil editor, then exported + baked like the rest.
 */
const writingNote = require('../../assets/folder/writing-note.png');

const R = {
  w_body: { x: 0.1, y: 0.18, w: 0.8, h: 0.55 } as Rect,
  w_save: { x: 0.62, y: 0.8, w: 0.3, h: 0.06 } as Rect,
} as const;

export default function WriteNoteScreen() {
  const router = useRouter();
  const [draft, setDraft] = useState('');
  const { mutate: addText, isPending } = useAddTextNote();

  const save = () => {
    if (!draft.trim() || isPending) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addText(draft, {
      onSuccess: () => router.back(),
      onError: (e) => Alert.alert('Could not save', e instanceof Error ? e.message : 'Try again.'),
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0d0b12' }}>
      <DrawnForm source={writingNote} label="writing-note" onBack={() => router.back()}>
        <FieldZone
          id="w_body"
          rect={R.w_body}
          value={draft}
          onChangeText={setDraft}
          placeholder="What's on your mind? Tap the mic on your keyboard to just talk…"
          multiline
          fontSize={18}
        />
        <LinkZone id="w_save" rect={R.w_save} onPress={save} />
      </DrawnForm>
    </View>
  );
}

/** An invisible tap over the drawn "save" mark. */
function LinkZone({ id, rect, onPress }: { id: string; rect: Rect; onPress: () => void }) {
  return <TickZone id={id} rect={rect} value={false} onToggle={onPress} />;
}
