import React from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { SafeArea } from '@/components/ui/SafeArea';
import { Card } from '@/components/ui/Card';
import { GreetingHeader } from '@/components/home/GreetingHeader';
import { MoodCheckin } from '@/components/home/MoodCheckin';
import { DrinkingSession } from '@/components/home/DrinkingSession';
import { PauseModal } from '@/components/home/PauseModal';
import { useYesterdaySession } from '@/hooks/useJournal';
import { useAppStore } from '@/store/appStore';

function MorningReflectionPrompt() {
  const { data: yesterdaySession } = useYesterdaySession();
  const { morningReflectionDismissed, dismissMorningReflection } = useAppStore();
  const router = useRouter();

  const isAfterMidnight = new Date().getHours() < 12;

  if (!yesterdaySession || morningReflectionDismissed || !isAfterMidnight) {
    return null;
  }

  return (
    <Animated.View entering={FadeIn.duration(400)} className="mx-6 mt-3">
      <Card className="border border-accent/20">
        <Text className="text-text-primary font-semibold mb-1">
          How was yesterday?
        </Text>
        <Text className="text-text-secondary text-sm mb-4 leading-relaxed">
          A moment of reflection can change everything.
        </Text>
        <View className="flex-row gap-2">
          <Pressable
            onPress={dismissMorningReflection}
            className="flex-1 items-center py-2.5 rounded-xl bg-surface-2 border border-white/8"
          >
            <Text className="text-text-secondary text-sm font-medium">Not now</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push('/session/morning-reflection')}
            className="flex-1 items-center py-2.5 rounded-xl bg-accent/20 border border-accent/40"
          >
            <Text className="text-accent text-sm font-semibold">Reflect</Text>
          </Pressable>
        </View>
      </Card>
    </Animated.View>
  );
}

export default function HomeScreen() {
  return (
    <SafeArea>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <GreetingHeader />
        <MoodCheckin />
        <MorningReflectionPrompt />
        <DrinkingSession />
      </ScrollView>
      <PauseModal />
    </SafeArea>
  );
}
