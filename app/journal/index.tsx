import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { DrawnForm, TickZone, type Rect } from '@/components/paper/DrawnForm';

/**
 * The writing desk — the Writing hub. The objects on the desk/in the drawer are
 * the ways in: the open journal (write a note), the "My notes" wallet (saved
 * notes), the dictaphone (voice note), and the time-filed index box (letters).
 * Taps are positionable zones — place them over each object in the pencil
 * editor, then export + bake. Reach it from the loft by routing to /journal.
 */
const desk = require('../../assets/folder/writing-desk.png');

const R = {
  d_journal: { x: 0.08, y: 0.06, w: 0.84, h: 0.3 } as Rect, // the open journal on the desktop
  // the four envelopes in the index box = the letter's delivery time
  d_env_30d: { x: 0.1, y: 0.52, w: 0.28, h: 0.045 } as Rect,
  d_env_90d: { x: 0.1, y: 0.57, w: 0.28, h: 0.045 } as Rect,
  d_env_6m: { x: 0.1, y: 0.62, w: 0.28, h: 0.045 } as Rect,
  d_env_1y: { x: 0.1, y: 0.67, w: 0.28, h: 0.045 } as Rect,
  d_notes: { x: 0.42, y: 0.52, w: 0.3, h: 0.2 } as Rect, // the "My notes" wallet
  d_voice: { x: 0.74, y: 0.52, w: 0.2, h: 0.2 } as Rect, // the dictaphone
} as const;

export default function WritingDeskScreen() {
  const router = useRouter();
  const go = (r: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(r as never);
  };
  // Pick a delivery time (envelope), then write the letter on the paper.
  const goLetter = (choice: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/letters/write', params: { choice } } as never);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0d0b12' }}>
      <DrawnForm source={desk} label="writing-desk" onBack={() => router.back()}>
        <LinkZone id="d_journal" rect={R.d_journal} onPress={() => go('/journal/write')} />
        <LinkZone id="d_env_30d" rect={R.d_env_30d} onPress={() => goLetter('30d')} />
        <LinkZone id="d_env_90d" rect={R.d_env_90d} onPress={() => goLetter('90d')} />
        <LinkZone id="d_env_6m" rect={R.d_env_6m} onPress={() => goLetter('6m')} />
        <LinkZone id="d_env_1y" rect={R.d_env_1y} onPress={() => goLetter('1y')} />
        <LinkZone id="d_notes" rect={R.d_notes} onPress={() => go('/journal/notes')} />
        <LinkZone id="d_voice" rect={R.d_voice} onPress={() => go('/journal/voice')} />
      </DrawnForm>
    </View>
  );
}

/** An invisible tap over a drawn object. */
function LinkZone({ id, rect, onPress }: { id: string; rect: Rect; onPress: () => void }) {
  return <TickZone id={id} rect={rect} value={false} onToggle={onPress} />;
}
