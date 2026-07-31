import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';

/**
 * The inner-page cousin of Home's orbit chips: a described navigation row that
 * carries ONE muted accent — a tinted icon disc, a hairline of colour on the
 * card — so destinations read as places (like Home) rather than grey list rows.
 * Says what the thing is *for*, not just its name, keeping discoverability.
 */
function rgba(hex: string, a: number): string {
  const h = hex.replace('#', '');
  return `rgba(${parseInt(h.slice(0, 2), 16)}, ${parseInt(h.slice(2, 4), 16)}, ${parseInt(h.slice(4, 6), 16)}, ${a})`;
}

export function ZoneChip({
  title,
  subtitle,
  icon,
  accent,
  meta,
  onPress,
}: {
  title: string;
  subtitle?: string;
  /** Optional leading icon disc. Omit for a text-only chip (title + subtitle). */
  icon?: keyof typeof Feather.glyphMap;
  accent: string;
  /** Optional short trailing label, e.g. a count ("2 reads"). */
  meta?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-2xl px-3.5 py-2.5 mb-2 active:opacity-80"
      style={{
        backgroundColor: rgba(accent, 0.07),
        borderWidth: 1,
        borderColor: rgba(accent, 0.22),
      }}
    >
      {icon ? (
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 11,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: rgba(accent, 0.16),
            borderWidth: 1,
            borderColor: rgba(accent, 0.42),
          }}
        >
          <Feather name={icon} size={17} color={accent} />
        </View>
      ) : null}
      <View className="flex-1">
        <Text className="text-text-primary text-base font-semibold">{title}</Text>
        {subtitle ? (
          <Text className="text-text-secondary text-xs mt-0.5 leading-snug">{subtitle}</Text>
        ) : null}
      </View>
      {meta ? (
        <Text style={{ color: rgba(accent, 0.95), fontSize: 12, fontFamily: 'Inter_600SemiBold' }}>
          {meta}
        </Text>
      ) : null}
      <Feather name="chevron-right" size={18} color={rgba(accent, 0.75)} />
    </Pressable>
  );
}
