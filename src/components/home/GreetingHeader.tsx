import React from 'react';
import { View, Text } from 'react-native';
import { SoulIconSmall } from '@/components/icons/SoulIcon';
import { useAuthStore } from '@/store/authStore';
import { useStreak } from '@/hooks/useInsights';

const GREETINGS = {
  early:     ["Still up?", "Late night.", "Hey."],
  morning:   ["Morning.", "You're here.", "Hey, morning."],
  afternoon: ["Hey.", "You're here.", "Glad you checked in."],
  evening:   ["Evening.", "Hey.", "Still here."],
  night:     ["Hey.", "One more day.", "Glad you're here."],
} as const;

function getGreeting(): string {
  const hour = new Date().getHours();
  const day = new Date().getDay();
  let bucket: keyof typeof GREETINGS;
  if (hour < 5) bucket = 'early';
  else if (hour < 11) bucket = 'morning';
  else if (hour < 17) bucket = 'afternoon';
  else if (hour < 21) bucket = 'evening';
  else bucket = 'night';
  const opts = GREETINGS[bucket];
  return opts[day % opts.length];
}

export function GreetingHeader() {
  const profile = useAuthStore((s) => s.profile);
  const { data: streakData } = useStreak();
  const name = profile?.username ?? profile?.full_name ?? 'there';
  const streak = streakData?.streak ?? 0;

  return (
    <View className="px-6 pt-4 pb-2">
      <View className="flex-row items-center justify-between mb-1">
        <View className="flex-row items-center gap-2">
          <SoulIconSmall size={20} />
          <Text className="text-text-muted text-xs font-medium tracking-widest uppercase">
            Alchono
          </Text>
        </View>
        {streak > 0 && (
          <View className="flex-row items-center gap-1.5 bg-white/6 border border-white/10 rounded-full px-3 py-1">
            <Text className="text-text-secondary text-xs font-semibold">
              {streak} {streak === 1 ? 'day' : 'days'}
            </Text>
          </View>
        )}
      </View>
      <Text className="text-text-primary text-3xl font-bold tracking-tight mt-3">
        {getGreeting()}{'\n'}
        <Text className="text-text-primary">{name}.</Text>
      </Text>
    </View>
  );
}
