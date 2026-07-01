import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Button } from '@/components/ui/Button';
import { useSubmitJournal, useYesterdaySession } from '@/hooks/useJournal';
import { JOURNAL_TRIGGERS, JOURNAL_AFFECTED } from '@/types';

export default function MorningReflectionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: yesterdaySession } = useYesterdaySession();
  const { mutate: submitJournal, isPending } = useSubmitJournal();
  const [step, setStep] = useState<'triggers' | 'impact' | 'notes'>('triggers');
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([]);
  const [selectedAffected, setSelectedAffected] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  const toggleTrigger = (trigger: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTriggers((prev) =>
      prev.includes(trigger) ? prev.filter((t) => t !== trigger) : [...prev, trigger],
    );
  };

  const toggleAffected = (person: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedAffected((prev) =>
      prev.includes(person) ? prev.filter((p) => p !== person) : [...prev, person],
    );
  };

  const handleSubmit = () => {
    submitJournal(
      {
        triggers: selectedTriggers,
        affectedOthers: selectedAffected,
        notes: notes.trim() || undefined,
        drinkingSessionId: yesterdaySession?.id,
      },
      {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert(
            'Reflection saved',
            'Thank you for taking the time to reflect.',
            [{ text: 'Done', onPress: () => router.back() }],
          );
        },
      },
    );
  };

  return (
    <View
      className="flex-1 bg-bg"
      style={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }}
    >
      <View className="flex-row items-center px-6 mb-6">
        <Pressable onPress={() => router.back()} className="mr-4">
          <Text className="text-text-secondary text-base">✕</Text>
        </Pressable>
        <Text className="text-text-primary text-lg font-semibold">
          Morning reflection
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {step === 'triggers' && (
          <Animated.View entering={FadeInDown.duration(400)}>
            <Text className="text-text-primary text-xl font-semibold mb-2">
              What happened yesterday?
            </Text>
            <Text className="text-text-secondary text-sm mb-5 leading-relaxed">
              Select anything that felt relevant. No judgement.
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {JOURNAL_TRIGGERS.map((trigger) => (
                <Pressable
                  key={trigger}
                  onPress={() => toggleTrigger(trigger)}
                  className={`px-4 py-2.5 rounded-xl border ${
                    selectedTriggers.includes(trigger)
                      ? 'bg-accent/20 border-accent/50'
                      : 'bg-surface border-white/8'
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      selectedTriggers.includes(trigger)
                        ? 'text-accent'
                        : 'text-text-secondary'
                    }`}
                  >
                    {trigger}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View className="mt-6">
              <Button
                title="Continue"
                variant="primary"
                fullWidth
                onPress={() => setStep('impact')}
              />
            </View>
          </Animated.View>
        )}

        {step === 'impact' && (
          <Animated.View entering={FadeInDown.duration(400)}>
            <Text className="text-text-primary text-xl font-semibold mb-2">
              Did alcohol affect anyone?
            </Text>
            <Text className="text-text-secondary text-sm mb-5 leading-relaxed">
              Honest awareness, nothing more.
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {JOURNAL_AFFECTED.map((person) => (
                <Pressable
                  key={person}
                  onPress={() => toggleAffected(person)}
                  className={`px-4 py-2.5 rounded-xl border ${
                    selectedAffected.includes(person)
                      ? 'bg-accent/20 border-accent/50'
                      : 'bg-surface border-white/8'
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      selectedAffected.includes(person)
                        ? 'text-accent'
                        : 'text-text-secondary'
                    }`}
                  >
                    {person}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View className="mt-6">
              <Button
                title="Continue"
                variant="primary"
                fullWidth
                onPress={() => setStep('notes')}
              />
            </View>
          </Animated.View>
        )}

        {step === 'notes' && (
          <Animated.View entering={FadeInDown.duration(400)}>
            <Text className="text-text-primary text-xl font-semibold mb-2">
              Anything else?
            </Text>
            <Text className="text-text-secondary text-sm mb-5 leading-relaxed">
              Optional. Just for you.
            </Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Write anything you'd like to remember…"
              placeholderTextColor="#5E6472"
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              className="bg-surface rounded-2xl px-4 py-4 text-text-primary text-sm leading-relaxed min-h-[120px] border border-white/5"
              selectionColor="#9CA3AF"
            />
            <View className="mt-6">
              <Button
                title="Save reflection"
                variant="primary"
                fullWidth
                loading={isPending}
                onPress={handleSubmit}
              />
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}
