import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SoulIconSmall } from '@/components/icons/SoulIcon';
import { headingShadow, celebrationGlow } from '@/styles';
import { useAuthStore } from '@/store/authStore';
import { useStreak } from '@/hooks/useInsights';
import { useDueLetter, daysAgo } from '@/hooks/useLetters';

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
  const { data: dueLetter } = useDueLetter();
  const router = useRouter();
  const name = profile?.username ?? profile?.full_name ?? null;
  const streak = streakData?.streak ?? 0;

  return (
    <View className="px-6 pt-5 pb-2">
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center gap-2">
          <SoulIconSmall size={28} />
          <Text className="text-text-muted text-sm font-medium tracking-widest uppercase">
            Alchono
          </Text>
        </View>
        {streak > 0 && (
          <Pressable
            onPress={() => router.push('/constellation')}
            hitSlop={8}
            className="flex-row items-center gap-1.5 bg-white/6 border border-white/10 rounded-full px-3 py-1.5 active:opacity-70"
          >
            <Text className="text-accent text-xs">✦</Text>
            <Text className="text-text-secondary text-sm font-semibold">
              {streak} {streak === 1 ? 'day' : 'days'}
            </Text>
          </Pressable>
        )}
      </View>

      {dueLetter ? (
        /* A letter from the past has come due — it quietly takes the greeting's
           place. Never announced twice; opening it delivers it for good. */
        <Pressable
          onPress={() => router.push(`/letters/${dueLetter.id}`)}
          className="mt-3 active:opacity-80"
        >
          <Text className="text-text-muted text-xs font-medium tracking-widest uppercase mb-2">
            A letter arrived
          </Text>
          <Text
            className="text-text-primary text-3xl font-semibold tracking-tight"
            style={celebrationGlow}
          >
            A letter from{'\n'}your past self.
          </Text>
          <Text className="text-text-secondary text-sm mt-3">
            Written {daysAgo(dueLetter.created_at) === 0
              ? 'today'
              : `${daysAgo(dueLetter.created_at)} day${daysAgo(dueLetter.created_at) === 1 ? '' : 's'} ago`}{' '}
            · tap to read →
          </Text>
        </Pressable>
      ) : (
        <Text
          className="text-text-primary text-4xl font-semibold tracking-tight mt-3"
          style={headingShadow}
        >
          {getGreeting()}
          {name ? `\n${name}.` : ''}
        </Text>
      )}
    </View>
  );
}
