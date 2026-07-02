import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import {
  useMyMentorProfile,
  useSaveMentorProfile,
  useStopMentoring,
} from '@/hooks/useMentors';
import { MENTOR_LEVELS } from '@/types';

export default function BecomeMentorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: mentorProfile, isLoading } = useMyMentorProfile();
  const { mutate: saveMentor, isPending: isSaving } = useSaveMentorProfile();
  const { mutate: stopMentoring, isPending: isStopping } = useStopMentoring();

  const isMentor = !!mentorProfile;
  const [level, setLevel] = useState<string | null>(null);
  const [bio, setBio] = useState('');
  const [available, setAvailable] = useState(true);

  // Populate the form once the existing mentor profile loads.
  useEffect(() => {
    if (mentorProfile) {
      setLevel(mentorProfile.recovery_level);
      setBio(mentorProfile.bio ?? '');
      setAvailable(mentorProfile.is_available);
    }
  }, [mentorProfile]);

  const handleSave = () => {
    if (!level) {
      Alert.alert('One more thing', 'Select how long you have been alcohol-free.');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    saveMentor(
      { recoveryLevel: level, bio, isAvailable: available },
      {
        onSuccess: () => {
          Alert.alert(
            isMentor ? 'Updated' : 'You are a mentor now',
            isMentor
              ? 'Your mentor profile has been updated.'
              : 'Your profile is live. People can now request to connect with you.',
            [{ text: 'Done', onPress: () => router.back() }],
          );
        },
        onError: (e) =>
          Alert.alert('Could not save', e instanceof Error ? e.message : 'Please try again.'),
      },
    );
  };

  const handleStop = () => {
    Alert.alert(
      'Stop mentoring?',
      'Your mentor profile will be removed. You can come back any time.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Stop mentoring',
          style: 'destructive',
          onPress: () =>
            stopMentoring(undefined, {
              onSuccess: () => router.back(),
              onError: (e) =>
                Alert.alert('Could not stop', e instanceof Error ? e.message : 'Please try again.'),
            }),
        },
      ],
    );
  };

  if (isLoading) return <LoadingSpinner message="Loading…" />;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-bg"
    >
      <View
        className="flex-1"
        style={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }}
      >
        <View className="flex-row items-center px-6 mb-6">
          <Pressable onPress={() => router.back()} className="mr-4" hitSlop={12}>
            <Text className="text-text-secondary text-lg">←</Text>
          </Pressable>
          <Text className="text-text-primary text-lg font-semibold">
            {isMentor ? 'Your mentoring' : 'Become a mentor'}
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text className="text-text-secondary text-base leading-relaxed mb-8">
            {isMentor
              ? 'Update your availability and what people see about you.'
              : "You've been where they are. Sharing that — anonymously, on your terms — can be the thing that gets someone through tonight."}
          </Text>

          <Text className="text-text-muted text-sm font-semibold tracking-widest uppercase mb-3">
            Alcohol-free for
          </Text>
          <View className="flex-row flex-wrap gap-2 mb-8">
            {MENTOR_LEVELS.map(({ label, value }) => {
              const selected = level === value;
              return (
                <Pressable
                  key={value}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setLevel(value);
                  }}
                  className={`px-4 py-3 rounded-xl border ${
                    selected ? 'bg-surface border-white/25' : 'bg-surface border-white/8'
                  }`}
                >
                  <Text
                    className={`text-base font-medium ${
                      selected ? 'text-text-primary' : 'text-text-muted'
                    }`}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View className="mb-8">
            <Input
              label="A few words about you (optional)"
              placeholder="What helped you? What can you offer?"
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              style={{ minHeight: 96 }}
              maxLength={280}
            />
            <Text className="text-text-muted text-sm mt-1.5 text-right">
              {bio.length}/280
            </Text>
          </View>

          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setAvailable((a) => !a);
            }}
            className="flex-row items-center justify-between bg-surface rounded-xl px-4 py-4 border border-white/8 mb-8"
          >
            <View className="flex-1 pr-4">
              <Text className="text-text-primary text-base font-medium">
                Available for new requests
              </Text>
              <Text className="text-text-muted text-sm mt-0.5">
                Turn off any time. Existing connections keep working.
              </Text>
            </View>
            <View
              style={{
                width: 46,
                height: 26,
                borderRadius: 13,
                backgroundColor: available ? '#C4C9D0' : '#1E2022',
                justifyContent: 'center',
                alignItems: available ? 'flex-end' : 'flex-start',
                paddingHorizontal: 3,
              }}
            >
              <View
                style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#F6F5F2' }}
              />
            </View>
          </Pressable>

          <Text className="text-text-muted text-sm leading-relaxed mb-6">
            Only your username, recovery time, and the words above are shown.
            No contact details are ever shared.
          </Text>

          <Button
            title={isMentor ? 'Save changes' : 'Start mentoring'}
            variant="primary"
            size="lg"
            fullWidth
            loading={isSaving}
            onPress={handleSave}
          />

          {isMentor && (
            <View className="mt-3">
              <Button
                title="Stop mentoring"
                variant="ghost"
                size="md"
                fullWidth
                loading={isStopping}
                onPress={handleStop}
              />
            </View>
          )}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}
