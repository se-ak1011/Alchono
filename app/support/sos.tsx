import React, { useEffect } from 'react';
import { View, Text, Pressable, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { AiCoachChat } from '@/components/support/AiCoachChat';
import { ZoneGlow } from '@/components/ui/ZoneGlow';
import { useAuthStore } from '@/store/authStore';
import { logSupportTap } from '@/hooks/useTrustedPerson';

export default function SosScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const userId = useAuthStore((s) => s.user?.id);
  const profile = useAuthStore((s) => s.profile);

  // The private "who to call" from the Personal File — a real human, one tap.
  const file = (profile as any)?.preferences?.file as { trustedName?: string; trustedContact?: string } | undefined;
  const trustedName = file?.trustedName?.trim();
  const trustedContact = file?.trustedContact?.trim();
  const callTrusted = () => {
    if (!trustedContact) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const url = trustedContact.includes('@') ? `mailto:${trustedContact}` : `tel:${trustedContact.replace(/[^+\d]/g, '')}`;
    Linking.openURL(url).catch(() => {});
  };

  // Reaching for support is the 🔴 signal a trusted person can see.
  useEffect(() => {
    logSupportTap(userId);
  }, [userId]);

  return (
    <View
      className="flex-1 bg-bg"
      style={{ paddingTop: insets.top + 8 }}
    >
      <ZoneGlow zone="support" intensity={0.55} />
      <Animated.View
        entering={FadeInDown.duration(400)}
        className="flex-row items-center px-6 mb-4"
      >
        <Pressable
          onPress={() => router.back()}
          className="w-8 h-8 rounded-full bg-surface items-center justify-center mr-3"
        >
          <Text className="text-text-secondary">✕</Text>
        </Pressable>
        <View>
          <Text className="text-text-primary text-lg font-semibold">
            I'm here with you.
          </Text>
          <Text className="text-text-muted text-xs mt-0.5">
            AI support · Private · Always available
          </Text>
        </View>
      </Animated.View>

      {trustedContact ? (
        <Animated.View entering={FadeInDown.duration(400).delay(80)} className="px-6 mb-3">
          <Pressable
            onPress={callTrusted}
            className="rounded-2xl px-5 py-4 active:opacity-80"
            style={{ backgroundColor: 'rgba(164,137,222,0.14)', borderWidth: 1, borderColor: 'rgba(164,137,222,0.4)' }}
          >
            <Text className="text-text-primary text-base font-semibold">
              📞  Call {trustedName || 'your person'}
            </Text>
            <Text className="text-text-muted text-xs mt-0.5">The one you wrote in your file.</Text>
          </Pressable>
        </Animated.View>
      ) : null}

      <AiCoachChat sessionType="sos" />
    </View>
  );
}
