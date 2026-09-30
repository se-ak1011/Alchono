import React from 'react';
import { View, Text, Pressable, TextInput, ActivityIndicator, type TextInputProps } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

/**
 * Paper-form kit — world-styled form pieces so "administrative" screens (My
 * circumstances, Things I enjoy, the plan, mentor, settings…) read like filling
 * in a paper document instead of a dark app form. Everything is dark INK on the
 * cream page; pair with <PaperBackground>. Reuse these everywhere so the whole
 * app speaks one language.
 */
export const INK = '#332a24';
export const INK_SOFT = 'rgba(51,42,36,0.55)';
export const INK_LINE = 'rgba(51,42,36,0.22)';
export const PAPER_ACCENT = '#6b4f9e'; // plum that reads on cream
const SEL_BG = 'rgba(107,79,158,0.16)';

const light = (h: string) => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

/** A hand-lettered section heading. */
export function PaperLabel({ children, style }: { children: React.ReactNode; style?: any }) {
  return (
    <Text style={[{ fontFamily: 'PatrickHand', fontSize: 18, color: INK, marginBottom: 8 }, style]}>
      {children}
    </Text>
  );
}

/** A field written on a ruled line. */
export function PaperInput(props: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor={INK_SOFT}
      selectionColor={PAPER_ACCENT}
      {...props}
      style={[
        {
          fontFamily: 'PatrickHand',
          fontSize: 18,
          color: INK,
          paddingVertical: 6,
          paddingHorizontal: 2,
          borderBottomWidth: 1.5,
          borderBottomColor: INK_LINE,
        },
        props.style,
      ]}
    />
  );
}

/** A tick-box row — for yes/this-applies choices (Partner, Children…). */
export function PaperTickRow({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={() => { light('l'); onPress(); }}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11 }}
    >
      <Feather name={selected ? 'check-square' : 'square'} size={20} color={selected ? PAPER_ACCENT : INK_SOFT} />
      <Text style={{ fontFamily: 'PatrickHand', fontSize: 19, color: selected ? INK : INK_SOFT }}>{label}</Text>
    </Pressable>
  );
}

/** A physical-feeling switch, warm. */
export function PaperSwitchRow({
  label,
  sublabel,
  value,
  onToggle,
}: {
  label: string;
  sublabel?: string;
  value: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable
      onPress={() => { light('l'); onToggle(); }}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: INK_LINE }}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: 'PatrickHand', fontSize: 19, color: INK }}>{label}</Text>
        {sublabel ? <Text style={{ color: INK_SOFT, fontSize: 12.5, lineHeight: 17, marginTop: 2 }}>{sublabel}</Text> : null}
      </View>
      <View style={{ width: 46, height: 27, borderRadius: 14, backgroundColor: value ? PAPER_ACCENT : 'rgba(51,42,36,0.18)', justifyContent: 'center', alignItems: value ? 'flex-end' : 'flex-start', paddingHorizontal: 3 }}>
        <View style={{ width: 21, height: 21, borderRadius: 11, backgroundColor: '#f3ecd9' }} />
      </View>
    </Pressable>
  );
}

/** Ticked paper tags — multi- or single-select. */
export function PaperChips({
  options,
  isSelected,
  onToggle,
}: {
  options: readonly { key: string; label: string }[];
  isSelected: (key: string) => boolean;
  onToggle: (key: string) => void;
}) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {options.map(({ key, label }) => {
        const on = isSelected(key);
        return (
          <Pressable
            key={key}
            onPress={() => { light('l'); onToggle(key); }}
            style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1.5, borderColor: on ? PAPER_ACCENT : INK_LINE, backgroundColor: on ? SEL_BG : 'transparent', flexDirection: 'row', alignItems: 'center', gap: 5 }}
          >
            {on ? <Feather name="check" size={13} color={PAPER_ACCENT} /> : null}
            <Text style={{ fontFamily: 'PatrickHand', fontSize: 16.5, color: on ? INK : INK_SOFT }}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Small number chooser (how many children / pets). */
export function PaperCount({
  label,
  options,
  value,
  onChange,
}: {
  label?: string;
  options: { value: number; label: string }[];
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <View style={{ marginTop: 4 }}>
      {label ? <Text style={{ color: INK_SOFT, fontSize: 13, marginBottom: 6 }}>{label}</Text> : null}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {options.map((opt) => {
          const on = value === opt.value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => { light('l'); onChange(opt.value); }}
              style={{ minWidth: 46, height: 42, paddingHorizontal: 10, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: on ? PAPER_ACCENT : INK_LINE, backgroundColor: on ? SEL_BG : 'transparent' }}
            >
              <Text style={{ fontFamily: 'PatrickHand', fontSize: 18, color: on ? INK : INK_SOFT }}>{opt.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/** The save action — a warm, hand-lettered button. */
export function PaperButton({
  title,
  onPress,
  loading,
  disabled,
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  const off = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      style={{ borderRadius: 16, paddingVertical: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: off ? 'rgba(107,79,158,0.35)' : PAPER_ACCENT }}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#f3ecd9" />
      ) : (
        <Text style={{ fontFamily: 'PatrickHand', fontSize: 21, color: '#f7f1e3' }}>{title}</Text>
      )}
    </Pressable>
  );
}
