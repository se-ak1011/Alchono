import React from 'react';
import { Modal, View, Text, Pressable, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import { DRINK_PRESETS, fmtUnits, type DrinkPreset } from '@/lib/units';

/**
 * A quick "what did you have?" sheet. Tapping a preset logs one drink carrying
 * its NHS units, so the diary is GP-legible without the member doing any maths.
 * Deliberately fast: one tap to log, dismiss to cancel.
 */
export function DrinkPicker({
  visible,
  onClose,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (preset: DrinkPreset) => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable onPress={onClose} className="flex-1 justify-end" style={{ backgroundColor: 'rgba(6,7,8,0.6)' }}>
        <Pressable
          onPress={() => {}}
          className="rounded-t-3xl border-t border-white/10 px-5 pt-4"
          style={{ backgroundColor: '#201D28', maxHeight: '78%', paddingBottom: 28 }}
        >
          <View className="items-center mb-3">
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(236,233,241,0.2)' }} />
          </View>
          <Text className="text-text-primary text-lg font-semibold mb-1">What did you have?</Text>
          <Text className="text-text-muted text-sm mb-3">
            Pick the closest — units are counted for you.
          </Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            {DRINK_PRESETS.map((p) => (
              <Pressable
                key={p.key}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onSelect(p);
                }}
                className="flex-row items-center justify-between rounded-2xl px-4 py-3.5 mb-2 border border-white/8 active:opacity-70"
                style={{ backgroundColor: 'rgba(236,233,241,0.04)' }}
              >
                <Text className="text-text-primary text-[15px] flex-1 pr-3">{p.label}</Text>
                <View className="rounded-full px-2.5 py-1" style={{ backgroundColor: 'rgba(164,137,222,0.16)', borderWidth: 1, borderColor: 'rgba(164,137,222,0.4)' }}>
                  <Text style={{ color: '#B9A4EC', fontSize: 12, fontWeight: '700' }}>
                    {fmtUnits(p.units)} {p.units === 1 ? 'unit' : 'units'}
                  </Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>

          <Pressable onPress={onClose} hitSlop={8} className="items-center py-3 mt-1 active:opacity-60">
            <Text className="text-text-muted text-sm">Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
