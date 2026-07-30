import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { SafeArea } from '@/components/ui/SafeArea';
import { ZoneGlow } from '@/components/ui/ZoneGlow';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { headingShadow } from '@/styles';

export type RecoveryPlan = {
  reasons?: string;
  people?: string;
  goTo?: string;
  warningSigns?: string;
};

const FIELDS: { key: keyof RecoveryPlan; label: string; hint: string; placeholder: string; accent: string }[] = [
  {
    key: 'reasons',
    label: 'My reasons',
    hint: 'Who and what you’re protecting. The why, in your own words.',
    placeholder: 'My kids. Waking up clear. The person I’m becoming…',
    accent: '#E6C56A',
  },
  {
    key: 'people',
    label: 'My people',
    hint: 'Who you’ll message or call on a hard night.',
    placeholder: 'Connor. My sister. My mentor…',
    accent: '#8AB2AE',
  },
  {
    key: 'goTo',
    label: 'My go-to moves',
    hint: 'The two or three things that actually work for you.',
    placeholder: 'Make a barista drink. Walk round the block. Breathing…',
    accent: '#B9A4EC',
  },
  {
    key: 'warningSigns',
    label: 'My early warning signs',
    hint: 'What a wobble feels like before it’s a craving — so you catch it early.',
    placeholder: 'Getting snappy. Skipping meals. “I deserve it” thoughts…',
    accent: '#CE969E',
  },
];

/**
 * My plan — a proactive, personal recovery plan, written in a calm moment and
 * there when it's needed. The counterpart to the reactive urge flow.
 */
export default function PlanScreen() {
  const router = useRouter();
  const { user, profile, setProfile } = useAuthStore();
  const existing = ((profile as any)?.recovery_plan ?? {}) as RecoveryPlan;

  const [plan, setPlan] = useState<RecoveryPlan>(existing);
  const [saving, setSaving] = useState(false);

  const set = (key: keyof RecoveryPlan, value: string) =>
    setPlan((p) => ({ ...p, [key]: value }));

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { data: updated, error } = await supabase
      .from('profiles')
      .update({ recovery_plan: plan as any })
      .eq('id', user.id)
      .select()
      .maybeSingle();
    setSaving(false);
    if (error) {
      Alert.alert('Could not save', error.message);
      return;
    }
    setProfile(updated ? (updated as any) : ({ ...profile!, recovery_plan: plan } as any));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  return (
    <SafeArea bottom={false}>
      <ZoneGlow zone="support" intensity={0.6} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={90}
      >
        <View className="px-6 pt-5 pb-2 flex-row items-center gap-3">
          <Pressable onPress={() => router.back()} hitSlop={12} className="p-1 -ml-1 active:opacity-60">
            <Feather name="chevron-left" size={26} color="#B2ACC0" />
          </Pressable>
          <View className="flex-1">
            <Text className="text-text-primary text-4xl tracking-tight" style={headingShadow}>
              My plan
            </Text>
            <Text className="text-text-secondary text-sm mt-1">
              Written now, calmly — for a harder moment later.
            </Text>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 28, paddingTop: 8 }}
        >
          {FIELDS.map((f) => (
            <View key={f.key} className="mb-5">
              <View className="flex-row items-center gap-2 mb-1">
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: f.accent }} />
                <Text className="text-text-primary text-base font-semibold">{f.label}</Text>
              </View>
              <Text className="text-text-muted text-xs mb-2 leading-relaxed">{f.hint}</Text>
              <TextInput
                value={plan[f.key] ?? ''}
                onChangeText={(t) => set(f.key, t)}
                placeholder={f.placeholder}
                placeholderTextColor="#5f5a70"
                multiline
                className="bg-surface rounded-2xl px-4 py-3.5 text-text-primary text-base border border-white/8"
                style={{ minHeight: 84, textAlignVertical: 'top' }}
                selectionColor="#B2ACC0"
              />
            </View>
          ))}

          <Button
            title={saving ? 'Saving…' : 'Save my plan'}
            variant="primary"
            size="md"
            fullWidth
            loading={saving}
            onPress={handleSave}
          />
          <Text className="text-text-muted text-xs text-center leading-relaxed mt-4">
            Private to you. You can change it anytime.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeArea>
  );
}
