import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useIsAdmin } from '@/hooks/useAdmin';
import { useUnverifiedProfessionals, useVerifyProfessional } from '@/hooks/usePro';

export default function AdminProfessionalsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: pros, isLoading } = useUnverifiedProfessionals();
  const { mutate: verify, isPending } = useVerifyProfessional();

  if (adminLoading) return <LoadingSpinner message="Checking access…" />;
  if (!isAdmin) {
    return (
      <View className="flex-1 bg-bg items-center justify-center px-10">
        <Text className="text-text-muted text-base text-center">
          This area is for the Alchono team.
        </Text>
        <Pressable onPress={() => router.back()} className="mt-6" hitSlop={12}>
          <Text className="text-text-secondary text-base">← Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View
      className="flex-1 bg-bg"
      style={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom }}
    >
      <View className="flex-row items-center px-6 mb-4">
        <Pressable onPress={() => router.back()} className="mr-4" hitSlop={12}>
          <Text className="text-text-secondary text-lg">←</Text>
        </Pressable>
        <Text className="text-text-primary text-lg font-semibold">
          Counsellor verification
        </Text>
      </View>

      {isLoading ? (
        <LoadingSpinner message="Loading…" />
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          {(pros ?? []).length === 0 ? (
            <View className="py-16 items-center">
              <Text className="text-text-muted text-base">No professional accounts yet.</Text>
            </View>
          ) : (
            (pros ?? []).map((p: any) => (
              <View
                key={p.user_id}
                className="bg-surface rounded-2xl px-5 py-4 mb-3 border border-white/8"
              >
                <Text className="text-text-primary text-base font-semibold">
                  {p.username}
                </Text>
                <Text className="text-text-muted text-sm mb-3">
                  {p.org || 'No organisation given'} ·{' '}
                  {new Date(p.created_at).toLocaleDateString('en-GB')}
                </Text>
                <Pressable
                  disabled={isPending}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    verify({ userId: p.user_id, verified: !p.verified });
                  }}
                  className={`py-3 rounded-xl items-center ${
                    p.verified ? 'bg-surface-2 border border-white/10' : 'bg-accent'
                  }`}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      p.verified ? 'text-text-secondary' : 'text-bg'
                    }`}
                  >
                    {p.verified ? 'Verified ✓ — tap to un-verify' : 'Verify'}
                  </Text>
                </Pressable>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}
