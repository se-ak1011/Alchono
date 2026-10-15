import React, { useState } from 'react';
import { View, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { DrawnForm, FieldZone, TickZone, ValueZone, type Rect } from '@/components/paper/DrawnForm';
import { useLogDrinkDiary } from '@/hooks/useDrinkEntries';
import { useToggleAlcoholFree } from '@/hooks/useVictories';

/**
 * Tonight — the drinks diary, written straight into the handwritten notebook.
 * Awareness, not judgement: tick whether you drank, then (if you did) jot what
 * you drank, roughly how much, when, and anything else — free text, no
 * unit-counting. "I didn't drink today" marks the alcohol-free day. Zones carry
 * rough default rects; position with the pencil editor + Export.
 */

const drinksDiary = require('../../assets/folder/drinks-diary.png');
const fmtDate = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

const R = {
  t_date: { x: 0.225, y: 0.262, w: 0.24, h: 0.026 } as Rect,
  t_had: { x: 0.085, y: 0.312, w: 0.055, h: 0.028 } as Rect,
  t_none: { x: 0.085, y: 0.348, w: 0.055, h: 0.028 } as Rect,
  t_what: { x: 0.07, y: 0.430, w: 0.34, h: 0.070 } as Rect,
  t_amount: { x: 0.07, y: 0.565, w: 0.34, h: 0.070 } as Rect,
  t_when: { x: 0.07, y: 0.700, w: 0.34, h: 0.050 } as Rect,
  t_else: { x: 0.55, y: 0.250, w: 0.38, h: 0.190 } as Rect,
  t_unsure: { x: 0.535, y: 0.735, w: 0.055, h: 0.028 } as Rect,
  t_add: { x: 0.60, y: 0.760, w: 0.33, h: 0.040 } as Rect,
} as const;

export default function TrackScreen() {
  const router = useRouter();
  const { mutate: logDrink } = useLogDrinkDiary();
  const { mutate: toggleAf } = useToggleAlcoholFree();

  const [drank, setDrank] = useState<null | 'yes' | 'no'>(null);
  const [what, setWhat] = useState('');
  const [amount, setAmount] = useState('');
  const [when, setWhen] = useState('');
  const [note, setNote] = useState('');
  const [unsure, setUnsure] = useState(false);
  const [saving, setSaving] = useState(false);

  const add = () => {
    if (saving) return;
    if (drank === null) {
      Alert.alert('Did you drink today?', 'Tick “I had a drink” or “I didn’t drink today”.');
      return;
    }
    setSaving(true);
    if (drank === 'no') {
      toggleAf(true, {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert('Marked alcohol-free', 'Today’s logged. That counts.', [{ text: 'Done', onPress: () => router.back() }]);
        },
        onError: () => { setSaving(false); Alert.alert('Couldn’t save', 'Please try again.'); },
      });
    } else {
      logDrink({ what, amount, when, note, unsure }, {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert('Added to your diary', 'Noticing is the whole point. No judgement.', [{ text: 'Done', onPress: () => router.back() }]);
        },
        onError: () => { setSaving(false); Alert.alert('Couldn’t save', 'Please try again.'); },
      });
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0d0b12' }}>
      <DrawnForm source={drinksDiary} label="drinks-diary" onBack={() => router.back()}>
        <ValueZone id="t_date" rect={R.t_date} text={fmtDate(new Date())} fontSize={15} numberOfLines={1} />
        {/* Radio: drank / didn't — mutually exclusive. */}
        <TickZone id="t_had" rect={R.t_had} mark="ring" value={drank === 'yes'} onToggle={() => setDrank((d) => (d === 'yes' ? null : 'yes'))} />
        <TickZone id="t_none" rect={R.t_none} mark="ring" value={drank === 'no'} onToggle={() => setDrank((d) => (d === 'no' ? null : 'no'))} />
        {/* The drink details — only meaningful when "I had a drink". */}
        <FieldZone id="t_what" rect={R.t_what} value={what} onChangeText={setWhat} placeholder="Beer, wine, a couple of G&Ts…" multiline fontSize={16} />
        <FieldZone id="t_amount" rect={R.t_amount} value={amount} onChangeText={setAmount} placeholder="A few, half a bottle…" multiline fontSize={16} />
        <FieldZone id="t_when" rect={R.t_when} value={when} onChangeText={setWhen} placeholder="After work, with dinner…" fontSize={16} />
        <FieldZone id="t_else" rect={R.t_else} value={note} onChangeText={setNote} placeholder="How it felt, what led to it, anything…" multiline fontSize={16} />
        <TickZone id="t_unsure" rect={R.t_unsure} mark="check" value={unsure} onToggle={() => setUnsure((v) => !v)} />
        <LinkZone id="t_add" rect={R.t_add} onPress={add} />
      </DrawnForm>
    </View>
  );
}

/** A tappable row — invisible over the drawn "Add to diary" underline. */
function LinkZone({ id, rect, onPress }: { id: string; rect: Rect; onPress: () => void }) {
  return (
    <TickZone id={id} rect={rect} value={false} onToggle={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); }} />
  );
}
