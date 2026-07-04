import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import {
  useTimeline,
  useAddMilestone,
  useDeleteMilestone,
} from '@/hooks/useTimeline';
import { headingShadow } from '@/styles';

function formatDate(d: string): string {
  return new Date(d + 'T12:00:00').toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function TimelineScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: entries, isLoading } = useTimeline();
  const { mutate: addMilestone, isPending: adding } = useAddMilestone();
  const { mutate: deleteMilestone } = useDeleteMilestone();

  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const today = new Date();
  const [day, setDay] = useState(String(today.getDate()));
  const [month, setMonth] = useState(String(today.getMonth() + 1));
  const [year, setYear] = useState(String(today.getFullYear()));

  const handleAdd = () => {
    const d = Number(day), m = Number(month), y = Number(year);
    const valid =
      title.trim().length > 0 &&
      y >= 2000 && y <= 2100 && m >= 1 && m <= 12 &&
      d >= 1 && d <= new Date(y, m, 0).getDate();
    if (!valid) {
      Alert.alert('Check the details', 'A title and a real date, please.');
      return;
    }
    const date = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    addMilestone(
      { title, date },
      {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setTitle('');
          setShowAdd(false);
        },
        onError: (e) =>
          Alert.alert('Could not save', e instanceof Error ? e.message : 'Try again.'),
      },
    );
  };

  const dateInput = {
    backgroundColor: '#161718',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: '#F0F2F4',
    fontSize: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    textAlign: 'center' as const,
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-bg"
    >
      <View
        className="flex-1"
        style={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom }}
      >
        <View className="flex-row items-center px-6 mb-2">
          <Pressable onPress={() => router.back()} className="mr-4" hitSlop={12}>
            <Text className="text-text-secondary text-lg">←</Text>
          </Pressable>
          <View className="flex-1">
            <Text className="text-text-primary text-2xl font-semibold" style={headingShadow}>
              Your story.
            </Text>
            <Text className="text-text-muted text-sm mt-0.5">
              Not numbers. Moments.
            </Text>
          </View>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowAdd((v) => !v);
            }}
            hitSlop={8}
            className="bg-surface rounded-xl px-3.5 py-2 border border-white/8"
          >
            <Text className="text-text-secondary text-sm font-medium">
              {showAdd ? 'Close' : '+ Pin a moment'}
            </Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {showAdd && (
            <Animated.View
              entering={FadeIn.duration(300)}
              className="bg-surface rounded-2xl p-4 mb-6 border border-white/8"
            >
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="First wedding sober, first match, first holiday…"
                placeholderTextColor="#5E6472"
                style={{
                  backgroundColor: '#161718',
                  borderRadius: 10,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  color: '#F0F2F4',
                  fontSize: 15,
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.08)',
                  marginBottom: 10,
                }}
              />
              <View className="flex-row gap-2 mb-3">
                <TextInput value={day} onChangeText={setDay} keyboardType="number-pad"
                  maxLength={2} placeholder="DD" placeholderTextColor="#5E6472"
                  style={[dateInput, { flex: 1 }]} />
                <TextInput value={month} onChangeText={setMonth} keyboardType="number-pad"
                  maxLength={2} placeholder="MM" placeholderTextColor="#5E6472"
                  style={[dateInput, { flex: 1 }]} />
                <TextInput value={year} onChangeText={setYear} keyboardType="number-pad"
                  maxLength={4} placeholder="YYYY" placeholderTextColor="#5E6472"
                  style={[dateInput, { flex: 1.4 }]} />
              </View>
              <Pressable
                onPress={handleAdd}
                disabled={adding}
                className="bg-accent rounded-xl py-3 items-center active:bg-accent-dark"
              >
                <Text className="text-bg text-sm font-semibold">
                  {adding ? 'Pinning…' : 'Pin it'}
                </Text>
              </Pressable>
            </Animated.View>
          )}

          {isLoading ? (
            <LoadingSpinner message="Reading your story…" />
          ) : (entries ?? []).length === 0 ? (
            <View className="py-16 items-center px-6">
              <Text className="text-text-muted text-base text-center leading-relaxed">
                Your story starts writing itself the first time you get
                through a hard moment or mark your first alcohol-free day.{'\n\n'}Or pin
                a moment yourself — it's yours to tell.
              </Text>
            </View>
          ) : (
            <View>
              {(entries ?? []).map((e, i) => (
                <Animated.View
                  key={e.id}
                  entering={FadeInDown.duration(300).delay(Math.min(i * 40, 400))}
                  className="flex-row"
                >
                  {/* Spine */}
                  <View className="items-center mr-4" style={{ width: 14 }}>
                    <View
                      className={`w-3 h-3 rounded-full mt-1.5 ${
                        e.derived ? 'bg-accent/70' : 'bg-urge-surface border border-accent/50'
                      }`}
                    />
                    {i < (entries ?? []).length - 1 && (
                      <View className="flex-1 w-px bg-white/10 my-1" />
                    )}
                  </View>
                  {/* Content */}
                  <View className="flex-1 pb-6">
                    <Text className="text-text-primary text-base font-semibold leading-snug">
                      {e.title}
                    </Text>
                    <View className="flex-row items-center gap-3 mt-0.5">
                      <Text className="text-text-muted text-sm">{formatDate(e.date)}</Text>
                      {!e.derived && (
                        <Pressable
                          onPress={() =>
                            Alert.alert('Remove this moment?', e.title, [
                              { text: 'Cancel', style: 'cancel' },
                              {
                                text: 'Remove',
                                style: 'destructive',
                                onPress: () => deleteMilestone(e.id),
                              },
                            ])
                          }
                          hitSlop={10}
                        >
                          <Text className="text-text-muted text-sm">×</Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                </Animated.View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}
