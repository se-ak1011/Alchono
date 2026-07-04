import React from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore } from '@/store/authStore';
import { useMyCareTeam, useRespondToCareRequest } from '@/hooks/usePro';

export default function CareTeamScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const username = useAuthStore((s) => s.profile?.username);
  const { data: links } = useMyCareTeam();
  const { mutate: respond } = useRespondToCareRequest();

  const pending = (links ?? []).filter((l) => l.status === 'pending');
  const accepted = (links ?? []).filter((l) => l.status === 'accepted');

  return (
    <View
      className="flex-1 bg-bg"
      style={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom }}
    >
      <View className="flex-row items-center px-6 mb-4">
        <Pressable onPress={() => router.back()} className="mr-4" hitSlop={12}>
          <Text className="text-text-secondary text-lg">←</Text>
        </Pressable>
        <Text className="text-text-primary text-lg font-semibold">Care team</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-text-secondary text-sm leading-relaxed mb-6">
          If you work with a counsellor or recovery professional, you can let
          them see your trends — check-ins, alcohol-free days, tough moments you got through.
          Never your journals, messages, or AI conversations. You approve every
          link and can revoke it any time.
        </Text>

        {/* My QR */}
        {!!username && (
          <View className="bg-surface rounded-2xl p-6 mb-6 border border-white/8 items-center">
            <Text className="text-text-muted text-xs font-semibold tracking-widest uppercase mb-4">
              Show this to your counsellor
            </Text>
            <View className="bg-white p-3 rounded-xl">
              <QRCode value={`alchono://pro/add/${username}`} size={160} />
            </View>
            <Text className="text-text-primary text-base font-semibold mt-4">
              {username}
            </Text>
            <Text className="text-text-muted text-xs mt-1 text-center leading-relaxed">
              Scanning or searching your username only lets them ASK.{'\n'}
              Nothing is shared until you approve it here.
            </Text>
          </View>
        )}

        {/* Pending requests */}
        {pending.map((l) => (
          <Animated.View
            key={l.id}
            entering={FadeInDown.duration(300)}
            className="bg-surface rounded-2xl px-5 py-4 mb-3 border border-white/10"
          >
            <Text className="text-text-primary text-base font-semibold mb-1">
              {l.otherUsername} is asking to see your trends.
            </Text>
            <Text className="text-text-muted text-sm mb-4 leading-relaxed">
              A verified professional. If you don't know who this is, decline.
            </Text>
            <View className="flex-row gap-2">
              <Button title="Decline" variant="secondary" size="sm" className="flex-1"
                onPress={() => respond({ linkId: l.id, status: 'declined' })} />
              <Button title="Allow" variant="primary" size="sm" className="flex-1"
                onPress={() => respond({ linkId: l.id, status: 'accepted' })} />
            </View>
          </Animated.View>
        ))}

        {/* Accepted */}
        {!!accepted.length && (
          <View className="mt-2">
            <Text className="text-text-muted text-xs font-semibold tracking-widest uppercase mb-3">
              Can see your trends
            </Text>
            {accepted.map((l) => (
              <View
                key={l.id}
                className="flex-row items-center gap-3 bg-surface rounded-xl px-4 py-3 mb-2 border border-white/5"
              >
                <Avatar username={l.otherUsername} size="sm" />
                <Text className="text-text-primary text-sm font-medium flex-1">
                  {l.otherUsername}
                </Text>
                <Pressable
                  onPress={() =>
                    Alert.alert(
                      'Revoke access?',
                      `${l.otherUsername} will immediately stop seeing your trends.`,
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Revoke',
                          style: 'destructive',
                          onPress: () => respond({ linkId: l.id, status: 'revoked' }),
                        },
                      ],
                    )
                  }
                  hitSlop={10}
                >
                  <Text className="text-danger-light text-sm">Revoke</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
