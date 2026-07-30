import React from 'react';
import { View, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';

/**
 * A small, consistent role marker shown next to a name: a peer Mentor, a
 * professional Counsellor, or an Official/curated account. One look, everywhere
 * a person appears — so who someone is reads at a glance.
 */
export type Role = 'mentor' | 'counsellor' | 'official';

const CONFIG: Record<Role, { label: string; icon: keyof typeof Feather.glyphMap; accent: string }> = {
  mentor: { label: 'Mentor', icon: 'users', accent: '#A9D19E' }, // sage — a peer
  counsellor: { label: 'Counsellor', icon: 'shield', accent: '#8AB2AE' }, // teal — professional
  official: { label: 'Official', icon: 'check', accent: '#E6C56A' }, // gold — curated
};

function rgba(hex: string, a: number): string {
  const h = hex.replace('#', '');
  return `rgba(${parseInt(h.slice(0, 2), 16)}, ${parseInt(h.slice(2, 4), 16)}, ${parseInt(h.slice(4, 6), 16)}, ${a})`;
}

export function RoleBadge({ role }: { role: Role }) {
  const c = CONFIG[role];
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        borderRadius: 999,
        paddingHorizontal: 8,
        paddingVertical: 3,
        backgroundColor: rgba(c.accent, 0.16),
        borderWidth: 1,
        borderColor: rgba(c.accent, 0.4),
      }}
    >
      <Feather name={c.icon} size={11} color={c.accent} />
      <Text style={{ color: c.accent, fontSize: 11, fontWeight: '700' }}>{c.label}</Text>
    </View>
  );
}
