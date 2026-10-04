import React, { useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface PinPadProps {
  /** How many digits the PIN has. */
  pinLength?: number;
  /** Called with the full PIN once that many digits are entered. */
  onComplete: (pin: string) => void;
  /** Change this value to clear the entered digits (e.g. after a wrong try). */
  resetKey?: number | string;
  /** Shown in red under the dots. */
  error?: string;
}

const ROWS: string[][] = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['', '0', 'del'],
];

/**
 * A plum-themed numeric keypad with a row of dots. Dumb input: it collects
 * digits and fires onComplete when `pinLength` are entered, then the parent
 * decides what happens next (and can clear it via `resetKey`).
 */
export function PinPad({ pinLength = 4, onComplete, resetKey, error }: PinPadProps) {
  const [digits, setDigits] = useState('');

  // Clear whenever the parent bumps resetKey (wrong PIN, step change, etc.).
  useEffect(() => {
    setDigits('');
  }, [resetKey]);

  const press = (d: string) => {
    if (digits.length >= pinLength) return;
    Haptics.selectionAsync().catch(() => {});
    const next = digits + d;
    setDigits(next);
    if (next.length === pinLength) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      onComplete(next);
    }
  };

  const del = () => {
    if (!digits.length) return;
    Haptics.selectionAsync().catch(() => {});
    setDigits(digits.slice(0, -1));
  };

  return (
    <View className="items-center">
      {/* Dots */}
      <View className="flex-row gap-4 mb-3">
        {Array.from({ length: pinLength }).map((_, i) => (
          <View
            key={i}
            className={`w-4 h-4 rounded-full ${
              i < digits.length ? 'bg-accent' : 'bg-white/15'
            }`}
          />
        ))}
      </View>

      <View className="h-6 mb-4">
        {error ? (
          <Text className="text-danger text-base text-center">{error}</Text>
        ) : null}
      </View>

      {/* Keypad */}
      <View className="gap-4">
        {ROWS.map((row, r) => (
          <View key={r} className="flex-row gap-6 justify-center">
            {row.map((cell, c) => {
              if (cell === '') return <View key={c} className="w-20 h-20" />;
              if (cell === 'del') {
                return (
                  <Pressable
                    key={c}
                    onPress={del}
                    className="w-20 h-20 rounded-full items-center justify-center active:bg-white/5"
                    hitSlop={6}
                  >
                    <Feather name="delete" size={26} color="#B2ACC0" />
                  </Pressable>
                );
              }
              return (
                <Pressable
                  key={c}
                  onPress={() => press(cell)}
                  className="w-20 h-20 rounded-full items-center justify-center bg-surface-2 border border-white/10 active:bg-surface"
                >
                  <Text className="text-text-primary text-3xl font-sans">{cell}</Text>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}
