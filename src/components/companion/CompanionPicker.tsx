import React from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  COMPANIONS,
  DEFAULT_COMPANION_ID,
  companionPose,
} from '@/lib/companions';

/**
 * Choose the companion "mate" who walks with you. Presentational — the parent
 * owns where the choice is stored (onboarding prefs vs. a settings save).
 */
export function CompanionPicker({
  value,
  onChange,
}: {
  value?: string | null;
  onChange: (id: string) => void;
}) {
  const selectedId = value ?? DEFAULT_COMPANION_ID;

  return (
    <View style={{ gap: 12 }}>
      {COMPANIONS.map((c) => {
        const active = c.id === selectedId;
        return (
          <Pressable
            key={c.id}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onChange(c.id);
            }}
            className={`flex-row items-center gap-4 rounded-2xl px-4 py-4 border ${
              active
                ? 'bg-surface-2 border-accent'
                : 'bg-surface border-white/8 active:border-white/25'
            }`}
          >
            <View
              className="rounded-xl overflow-hidden bg-bg items-center justify-end"
              style={{ width: 68, height: 68 }}
            >
              <Image
                source={companionPose(c, 'standing')}
                style={{ width: 68, height: 84 }}
                resizeMode="contain"
              />
            </View>
            <View className="flex-1">
              <Text className="text-text-primary text-lg font-semibold">
                {c.name}
              </Text>
              <Text className="text-text-muted text-sm mt-0.5 leading-relaxed">
                {c.blurb}
              </Text>
            </View>
            <View
              className={`w-6 h-6 rounded-full items-center justify-center ${
                active ? 'bg-accent' : 'border border-white/15'
              }`}
            >
              {active && <Text className="text-white text-xs">✓</Text>}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
