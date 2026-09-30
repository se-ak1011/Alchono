import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { DrawnForm, FieldZone, type Rect } from '@/components/paper/DrawnForm';
import { useGoals, useAddGoal, useUpdateGoal } from '@/hooks/useGoals';

/**
 * "Looking forward to" — the drawn trail map. Your goals are written straight
 * onto the path as stops along the journey, bottom (where you are now, by the
 * bench) climbing to the horizon. No app card: you tap a stop and write on it.
 * Stops bind to the real goals list; typing an empty stop plants a new goal,
 * editing one updates it. Positions are rough here — the pencil editor drags +
 * exports the exact spots onto Marta's drawn slots, same as the folder.
 */

const trail = require('../../assets/scenes/looking-forward.png');

// Trail order: start (bench, bottom) → far (horizon, top).
const STOPS: Rect[] = [
  { x: 0.72, y: 0.84, w: 0.24, h: 0.05 }, // by the bench — where you are now
  { x: 0.23, y: 0.71, w: 0.22, h: 0.05 },
  { x: 0.24, y: 0.49, w: 0.22, h: 0.05 },
  { x: 0.55, y: 0.35, w: 0.25, h: 0.05 },
  { x: 0.21, y: 0.285, w: 0.2, h: 0.05 }, // the horizon
];

export default function LookingForwardScreen() {
  const router = useRouter();
  const { data: goals } = useGoals();
  const addGoal = useAddGoal();
  const updateGoal = useUpdateGoal();

  const [text, setText] = useState<string[]>(() => Array(STOPS.length).fill(''));
  const idsRef = useRef<(string | null)[]>(Array(STOPS.length).fill(null));
  const synced = useRef(false);

  // Seed the stops from the server once, so a background refetch never clobbers
  // what's being typed. New ids are captured on add via onSuccess below.
  useEffect(() => {
    if (synced.current || !goals) return;
    synced.current = true;
    const active = goals.filter((g: any) => !g.completed_at).slice(0, STOPS.length);
    const next = Array(STOPS.length).fill('') as string[];
    const ids = Array(STOPS.length).fill(null) as (string | null)[];
    active.forEach((g: any, i: number) => {
      next[i] = g.text ?? '';
      ids[i] = g.id;
    });
    setText(next);
    idsRef.current = ids;
  }, [goals]);

  const commit = (i: number) => {
    const t = text[i].trim();
    const id = idsRef.current[i];
    if (!t) return; // clearing a stop doesn't delete for now
    if (id) {
      updateGoal.mutate({ id, text: t });
    } else {
      addGoal.mutate(
        { text: t },
        { onSuccess: (row: any) => { idsRef.current[i] = row?.id ?? null; } },
      );
    }
  };

  return (
    <DrawnForm source={trail} label="looking-forward" onBack={() => router.back()}>
      {STOPS.map((rect, i) => (
        <FieldZone
          key={i}
          id={`stop${i}`}
          rect={rect}
          value={text[i]}
          onChangeText={(v) => setText((p) => { const n = [...p]; n[i] = v; return n; })}
          onEndEditing={() => commit(i)}
          placeholder="a step…"
          multiline
          fontSize={15}
          align="center"
        />
      ))}
    </DrawnForm>
  );
}
