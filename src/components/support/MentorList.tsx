import React, { useState } from 'react';
import { View, Text, FlatList, Pressable, Alert } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAvailableMentors, useRequestMentor } from '@/hooks/useMentors';
import { useAuthStore } from '@/store/authStore';
import { MENTOR_LEVELS } from '@/types';

export function MentorList() {
  const router = useRouter();
  const { data: mentors, isLoading } = useAvailableMentors();
  const { mutate: requestMentor, isPending } = useRequestMentor();
  const [requestedId, setRequestedId] = useState<string | null>(null);
  const iAmIsolated =
    ((useAuthStore((s) => s.profile)?.preferences as any)?.livesIsolated ?? false) === true;

  if (isLoading) return <LoadingSpinner message="Finding mentors…" />;

  const levelLabel = (value: string) =>
    MENTOR_LEVELS.find((l) => l.value === value)?.label ?? value;

  // Isolated users see mentors who also live rural first — they get it.
  const sorted = iAmIsolated
    ? [...(mentors ?? [])].sort(
        (a, b) => Number((b as any).is_rural ?? false) - Number((a as any).is_rural ?? false),
      )
    : mentors;

  return (
    <FlatList
      data={sorted}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
      showsVerticalScrollIndicator={false}
      renderItem={({ item, index }) => (
        <Animated.View
          entering={FadeInDown.duration(300).delay(index * 50).springify()}
          className="mb-3"
        >
          <Card elevated>
            <View className="flex-row items-start gap-3 mb-3">
              <Avatar
                username={(item as any).username}
                size="md"
              />
              <View className="flex-1">
                <View className="flex-row items-center gap-2 mb-1">
                  <Text className="text-text-primary font-semibold text-base">
                    {(item as any).username ?? 'Mentor'}
                  </Text>
                  <Badge
                    label={levelLabel(item.recovery_level)}
                    variant="accent"
                  />
                  {(item as any).is_rural && (
                    <Badge label="Rural" variant="accent" />
                  )}
                </View>
                <Text className="text-text-secondary text-sm">
                  {item.total_sessions} sessions · Available now
                </Text>
              </View>
              <View className="w-2 h-2 rounded-full bg-accent mt-1" />
            </View>
            {item.bio && (
              <Text className="text-text-secondary text-base leading-relaxed mb-4">
                {item.bio}
              </Text>
            )}
            <Button
              title={requestedId === item.id ? 'Request sent' : 'Connect'}
              variant={requestedId === item.id ? 'secondary' : 'accent'}
              size="md"
              fullWidth
              disabled={requestedId === item.id || isPending}
              onPress={async () => {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                Alert.alert(
                  'Connect with mentor?',
                  'Your username will be shared. No contact details are exchanged.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Send request',
                      onPress: () => {
                        requestMentor(
                          { mentorId: item.user_id },
                          { onSuccess: () => setRequestedId(item.id) },
                        );
                      },
                    },
                  ],
                );
              }}
            />
          </Card>
        </Animated.View>
      )}
      ListEmptyComponent={
        <View className="px-2 pt-2">
          <Text className="text-text-primary text-lg font-semibold mb-1">
            No mentors online right now.
          </Text>
          <Text className="text-text-secondary text-base leading-relaxed mb-6">
            They come and go through the day — worth checking back. Here's how
            it works when one's around.
          </Text>

          <View className="bg-surface rounded-2xl px-5 py-5 border border-white/8 mb-4" style={{ borderTopColor: 'rgba(255,255,255,0.1)' }}>
            {[
              ['Peers, not professionals', 'Mentors are people further along their own recovery — they’ve been where you are.'],
              ['Anonymous by default', 'Only your username is shared. No phone numbers, no real names, no contact details.'],
              ['You reach out, they respond', 'Send a request; if they accept, you can message inside the app. Either of you can end it anytime.'],
            ].map(([title, body]) => (
              <View key={title} className="flex-row gap-3 mb-3 last:mb-0">
                <Text className="text-accent text-base mt-0.5">—</Text>
                <View className="flex-1">
                  <Text className="text-text-primary text-base font-medium">{title}</Text>
                  <Text className="text-text-muted text-sm leading-relaxed mt-0.5">{body}</Text>
                </View>
              </View>
            ))}
          </View>

          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/profile/become-mentor');
            }}
            className="bg-surface rounded-2xl px-5 py-4 border border-white/8 active:border-white/20 flex-row items-center justify-between"
          >
            <View className="flex-1 pr-3">
              <Text className="text-text-primary text-base font-semibold">
                Been there yourself?
              </Text>
              <Text className="text-text-muted text-sm mt-0.5">
                Become a mentor — the thing that helped you might help someone else.
              </Text>
            </View>
            <Text className="text-text-muted text-lg">→</Text>
          </Pressable>
        </View>
      }
    />
  );
}
