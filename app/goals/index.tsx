import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, Layout } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { headingShadow } from '@/styles';
import {
  useGoals,
  useAddGoal,
  useCompleteGoal,
  useDeleteGoal,
  formatTargetDate,
  daysUntil,
} from '@/hooks/useGoals';
import type { Goal } from '@/types';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function MonthYearPicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  const now = new Date();
  const [month, setMonth] = useState<number | null>(value ? new Date(value + 'T12:00:00').getMonth() : null);
  const [year, setYear] = useState(value ? new Date(value + 'T12:00:00').getFullYear() : now.getFullYear());

  const commit = (m: number | null, y: number) => {
    if (m === null) { onChange(null); return; }
    const mm = String(m + 1).padStart(2, '0');
    onChange(`${y}-${mm}-01`);
  };

  const adjustYear = (delta: number) => {
    const next = year + delta;
    setYear(next);
    commit(month, next);
  };

  const selectMonth = (m: number) => {
    const next = month === m ? null : m;
    setMonth(next);
    commit(next, year);
  };

  return (
    <View style={{ marginTop: 12 }}>
      {/* Year selector */}
      <View className="flex-row items-center justify-between mb-3">
        <Pressable onPress={() => adjustYear(-1)} hitSlop={12}>
          <Text className="text-text-muted text-lg">‹</Text>
        </Pressable>
        <Text className="text-text-secondary text-sm font-semibold">{year}</Text>
        <Pressable onPress={() => adjustYear(1)} hitSlop={12}>
          <Text className="text-text-muted text-lg">›</Text>
        </Pressable>
      </View>

      {/* Month grid */}
      <View className="flex-row flex-wrap gap-2">
        {MONTHS.map((label, i) => {
          const selected = month === i;
          return (
            <Pressable
              key={label}
              onPress={() => selectMonth(i)}
              style={{ width: '22%' }}
              className={`items-center py-2 rounded-lg border ${
                selected ? 'bg-surface-2 border-white/20' : 'border-white/8'
              }`}
            >
              <Text className={`text-xs font-medium ${selected ? 'text-text-primary' : 'text-text-muted'}`}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {value && (
        <Pressable onPress={() => { setMonth(null); onChange(null); }} className="mt-3 items-center">
          <Text className="text-text-muted text-xs">Clear date</Text>
        </Pressable>
      )}
    </View>
  );
}

function GoalRow({
  goal,
  onComplete,
  onDelete,
}: {
  goal: Goal;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const done = !!goal.completed_at;
  const days = goal.target_date && !done ? daysUntil(goal.target_date) : null;

  const handleDelete = () => {
    Alert.alert('Remove goal?', `"${goal.text}"`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onDelete(goal.id);
        },
      },
    ]);
  };

  return (
    <Animated.View
      entering={FadeInDown.duration(300)}
      layout={Layout.springify()}
      className={`flex-row items-start gap-3 bg-surface rounded-2xl px-4 py-4 mb-3 border ${
        done ? 'border-white/5 opacity-50' : 'border-white/8'
      }`}
    >
      {/* Complete toggle */}
      <Pressable
        onPress={() => {
          if (!done) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onComplete(goal.id);
          }
        }}
        hitSlop={8}
        className="mt-0.5"
      >
        <Text className={`text-sm ${done ? 'text-text-muted' : 'text-text-muted'}`}>
          {done ? '◆' : '◇'}
        </Text>
      </Pressable>

      {/* Content */}
      <View className="flex-1">
        <Text className={`text-sm font-medium leading-relaxed ${done ? 'text-text-muted' : 'text-text-primary'}`}>
          {goal.text}
        </Text>
        {goal.target_date && (
          <View className="flex-row items-center gap-2 mt-1">
            <Text className="text-text-muted text-xs">
              {formatTargetDate(goal.target_date)}
            </Text>
            {days !== null && !done && (
              <Text className={`text-xs font-medium ${
                days < 0 ? 'text-danger-light' : days < 30 ? 'text-text-secondary' : 'text-text-muted'
              }`}>
                {days < 0 ? `${Math.abs(days)}d ago` : days === 0 ? 'today' : `in ${days}d`}
              </Text>
            )}
          </View>
        )}
        {done && goal.completed_at && (
          <Text className="text-text-muted text-xs mt-1">
            Done {new Date(goal.completed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
          </Text>
        )}
      </View>

      {/* Delete */}
      <Pressable onPress={handleDelete} hitSlop={12}>
        <Text className="text-text-muted text-base leading-none">×</Text>
      </Pressable>
    </Animated.View>
  );
}

export default function GoalsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: allGoals = [], isLoading } = useGoals();
  const { mutate: addGoal, isPending: adding } = useAddGoal();
  const { mutate: completeGoal } = useCompleteGoal();
  const { mutate: deleteGoal } = useDeleteGoal();

  const [text, setText] = useState('');
  const [targetDate, setTargetDate] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const activeGoals = allGoals.filter((g) => !g.completed_at);
  const completedGoals = allGoals.filter((g) => !!g.completed_at);
  const [showCompleted, setShowCompleted] = useState(false);

  const handleAdd = () => {
    if (!text.trim()) return;
    addGoal(
      { text: text.trim(), targetDate },
      {
        onSuccess: () => {
          setText('');
          setTargetDate(null);
          setShowDatePicker(false);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        },
        onError: (e) => {
          Alert.alert(
            'Could not save',
            e instanceof Error ? e.message : 'Please try again.',
          );
        },
      },
    );
  };

  return (
    <View
      className="flex-1 bg-bg"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      {/* Header */}
      <View className="flex-row items-center gap-4 px-6 pt-4 pb-3">
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text className="text-text-muted text-sm">←</Text>
        </Pressable>
        <Text className="text-text-primary text-2xl font-semibold tracking-tight flex-1" style={headingShadow}>
          Looking forward to.
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 48 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Add form */}
        <Animated.View entering={FadeIn.duration(400)} className="bg-surface rounded-2xl p-4 mb-6 border border-white/8">
          <TextInput
            placeholder="Something to look forward to…"
            placeholderTextColor="#4B5563"
            value={text}
            onChangeText={setText}
            onSubmitEditing={handleAdd}
            returnKeyType="done"
            multiline
            style={{
              color: '#F0F2F4',
              fontSize: 15,
              lineHeight: 22,
              marginBottom: 12,
              minHeight: 44,
            }}
          />

          <Pressable
            onPress={() => setShowDatePicker((v) => !v)}
            className="flex-row items-center gap-2 mb-2"
          >
            <Text className="text-text-muted text-xs">◇</Text>
            <Text className={`text-sm ${targetDate ? 'text-text-secondary' : 'text-text-muted'}`}>
              {targetDate ? formatTargetDate(targetDate) : 'Set a date (optional)'}
            </Text>
          </Pressable>

          {showDatePicker && (
            <MonthYearPicker value={targetDate} onChange={setTargetDate} />
          )}

          <View className="mt-3">
            <Pressable
              onPress={handleAdd}
              disabled={!text.trim() || adding}
              className={`py-3 rounded-xl items-center ${
                text.trim() ? 'bg-accent active:bg-accent-dark' : 'bg-surface-2'
              }`}
            >
              <Text className={`text-sm font-semibold ${text.trim() ? 'text-[#0E0F10]' : 'text-text-muted'}`}>
                {adding ? 'Adding…' : 'Add'}
              </Text>
            </Pressable>
          </View>
        </Animated.View>

        {/* Active goals */}
        {activeGoals.length > 0 && (
          <View>
            <Text className="text-text-muted text-xs font-semibold tracking-widest uppercase mb-3 ml-1">
              Active · {activeGoals.length}
            </Text>
            {activeGoals.map((goal) => (
              <GoalRow
                key={goal.id}
                goal={goal}
                onComplete={completeGoal}
                onDelete={deleteGoal}
              />
            ))}
          </View>
        )}

        {activeGoals.length === 0 && !isLoading && (
          <View className="items-center py-8">
            <Text className="text-text-muted text-sm text-center leading-relaxed">
              Add something you're building towards.{'\n'}A plan, a date, a reason.
            </Text>
          </View>
        )}

        {/* Completed goals */}
        {completedGoals.length > 0 && (
          <View className="mt-4">
            <Pressable
              onPress={() => setShowCompleted((v) => !v)}
              className="flex-row items-center gap-2 mb-3 ml-1"
            >
              <Text className="text-text-muted text-xs font-semibold tracking-widest uppercase">
                Done · {completedGoals.length}
              </Text>
              <Text className="text-text-muted text-xs">{showCompleted ? '▲' : '▼'}</Text>
            </Pressable>
            {showCompleted && completedGoals.map((goal) => (
              <GoalRow
                key={goal.id}
                goal={goal}
                onComplete={completeGoal}
                onDelete={deleteGoal}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
