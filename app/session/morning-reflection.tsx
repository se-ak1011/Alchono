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
import { JOURNAL_TRIGGERS, JOURNAL_AFFECTED, JOURNAL_WENT_WELL } from '@/types';

export default function MorningReflectionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: yesterdaySession } = useYesterdaySession();
  const drankYesterday = !!yesterdaySession;
  const { mutate: submitJournal, isPending } = useSubmitJournal();
  const [step, setStep] = useState<'triggers' | 'impact' | 'good' | 'notes'>('triggers');
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([]);
  const [selectedAffected, setSelectedAffected] = useState<string[]>([]);
  const [selectedWentWell, setSelectedWentWell] = useState<string[]>([]);
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

  const toggleWentWell = (thing: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedWentWell((prev) =>
      prev.includes(thing) ? prev.filter((t) => t !== thing) : [...prev, thing],
    );
  };

  const handleSubmit = () => {
    submitJournal(
      {
        triggers: selectedTriggers,
        affectedOthers: selectedAffected,
        wentWell: selectedWentWell,
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
          <Text className="text-text-secondary text-xl">✕</Text>
        </Pressable>
        <Text className="text-text-primary text-xl font-semibold">
          Morning reflection
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {step === 'triggers' && (
          <Animated.View entering={FadeInDown.duration(400)}>
            <Text className="text-text-primary text-2xl font-semibold mb-2">
              What happened yesterday?
            </Text>
            <Text className="text-text-secondary text-base mb-6 leading-relaxed">
              Good, hard, or somewhere in between — pick anything that fits. No judgement.
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {JOURNAL_TRIGGERS.map((trigger) => (
                <Pressable
                  key={trigger}
                  onPress={() => toggleTrigger(trigger)}
                  className={`px-5 py-3 rounded-xl border ${
                    selectedTriggers.includes(trigger)
                      ? 'bg-accent/20 border-accent/50'
                      : 'bg-surface border-white/8'
                  }`}
                >
                  <Text
                    className={`text-base font-medium ${
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
            <View className="mt-8">
              <Button
                title="Continue"
                variant="primary"
                size="lg"
                fullWidth
                // Only ask about alcohol's impact on days there was a drink —
                // otherwise go straight to what went well.
                onPress={() => setStep(drankYesterday ? 'impact' : 'good')}
              />
            </View>
          </Animated.View>
        )}

        {step === 'impact' && (
          <Animated.View entering={FadeInDown.duration(400)}>
            <Text className="text-text-primary text-2xl font-semibold mb-2">
              Did alcohol affect anyone?
            </Text>
            <Text className="text-text-secondary text-base mb-6 leading-relaxed">
              Honest awareness, nothing more.
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {JOURNAL_AFFECTED.map((person) => (
                <Pressable
                  key={person}
                  onPress={() => toggleAffected(person)}
                  className={`px-5 py-3 rounded-xl border ${
                    selectedAffected.includes(person)
                      ? 'bg-accent/20 border-accent/50'
                      : 'bg-surface border-white/8'
                  }`}
                >
                  <Text
                    className={`text-base font-medium ${
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
            <View className="mt-8">
              <Button
                title="Continue"
                variant="primary"
                size="lg"
                fullWidth
                onPress={() => setStep('good')}
              />
            </View>
          </Animated.View>
        )}

        {step === 'good' && (
          <Animated.View entering={FadeInDown.duration(400)}>
            <Text className="text-text-primary text-2xl font-semibold mb-2">
              What was good?
            </Text>
            <Text className="text-text-secondary text-base mb-6 leading-relaxed">
              Even the small stuff. The good is worth noticing too.
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {JOURNAL_WENT_WELL.map((thing) => (
                <Pressable
                  key={thing}
                  onPress={() => toggleWentWell(thing)}
                  className={`px-5 py-3 rounded-xl border ${
                    selectedWentWell.includes(thing)
                      ? 'bg-accent/20 border-accent/50'
                      : 'bg-surface border-white/8'
                  }`}
                >
                  <Text
                    className={`text-base font-medium ${
                      selectedWentWell.includes(thing)
                        ? 'text-accent'
                        : 'text-text-secondary'
                    }`}
                  >
                    {thing}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View className="mt-8">
              <Button
                title="Continue"
                variant="primary"
                size="lg"
                fullWidth
                onPress={() => setStep('notes')}
              />
            </View>
          </Animated.View>
        )}

        {step === 'notes' && (
          <Animated.View entering={FadeInDown.duration(400)}>
            <Text className="text-text-primary text-2xl font-semibold mb-2">
              Anything worth keeping?
            </Text>
            <Text className="text-text-secondary text-base mb-6 leading-relaxed">
              Optional — and the good bits count too. Just for you.
            </Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Write anything you'd like to remember…"
              placeholderTextColor="#5E6472"
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              className="bg-surface rounded-2xl px-5 py-5 text-text-primary text-base leading-relaxed min-h-[140px] border border-white/5"
              selectionColor="#9CA3AF"
            />
            <View className="mt-8">
              <Button
                title="Save reflection"
                variant="primary"
                size="lg"
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
