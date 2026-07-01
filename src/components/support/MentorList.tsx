import React, { useState } from 'react';
import { View, Text, FlatList, Pressable, Alert } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAvailableMentors, useRequestMentor } from '@/hooks/useMentors';
import { MENTOR_LEVELS } from '@/types';

export function MentorList() {
  const { data: mentors, isLoading } = useAvailableMentors();
  const { mutate: requestMentor, isPending } = useRequestMentor();
  const [requestedId, setRequestedId] = useState<string | null>(null);

  if (isLoading) return <LoadingSpinner message="Finding mentors…" />;

  const levelLabel = (value: string) =>
    MENTOR_LEVELS.find((l) => l.value === value)?.label ?? value;

  return (
    <FlatList
      data={mentors}
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
                username={(item as any).profiles?.username}
                size="md"
              />
              <View className="flex-1">
                <View className="flex-row items-center gap-2 mb-1">
                  <Text className="text-text-primary font-semibold text-base">
                    {(item as any).profiles?.username ?? 'Mentor'}
                  </Text>
                  <Badge
                    label={levelLabel(item.recovery_level)}
                    variant="accent"
                  />
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
        <View className="py-12 items-center">
          <Text className="text-text-muted text-base text-center">
            No mentors available right now.{'\n'}Check back soon.
          </Text>
        </View>
      }
    />
  );
}
