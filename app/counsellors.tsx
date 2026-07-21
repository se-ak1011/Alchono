import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Linking,
  Alert,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Avatar } from '@/components/ui/Avatar';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useCounsellorDirectory } from '@/hooks/usePro';
import { headingShadow } from '@/styles';

export default function CounsellorsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: entries, isLoading } = useCounsellorDirectory();
  const [query, setQuery] = useState('');

  const open = async (url: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const withScheme = url.startsWith('http') ? url : `https://${url}`;
    try {
      await Linking.openURL(withScheme);
    } catch {
      Alert.alert('Could not open', withScheme);
    }
  };

  const q = query.trim().toLowerCase();
  const visible = (entries ?? []).filter(
    (e) =>
      !q ||
      e.username.toLowerCase().includes(q) ||
      (e.org ?? '').toLowerCase().includes(q),
  );

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#201D28',
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }}
    >
      <Animated.View
        entering={FadeIn.duration(300)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 16,
          paddingHorizontal: 24,
          paddingTop: 16,
          paddingBottom: 12,
        }}
      >
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={{ color: '#817B91', fontSize: 18 }}>←</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: '#ECE9F1',
              fontSize: 26,
              fontFamily: 'Inter_600SemiBold',
              ...headingShadow,
            }}
          >
            Find a counsellor.
          </Text>
          <Text style={{ color: '#817B91', fontSize: 15, marginTop: 2 }}>
            Verified recovery professionals on Alchono.
          </Text>
        </View>
      </Animated.View>

      <View className="px-6 mb-4">
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search by name or organisation…"
          placeholderTextColor="#817B91"
          autoCapitalize="none"
          autoCorrect={false}
          style={{
            backgroundColor: '#383243',
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 12,
            color: '#ECE9F1',
            fontSize: 15,
            borderWidth: 1,
            borderColor: 'rgba(243, 240, 244, 0.10)',
          }}
        />
      </View>

      {isLoading ? (
        <LoadingSpinner message="Finding counsellors…" />
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {visible.length === 0 ? (
            <View className="py-16 items-center px-6">
              <Text className="text-text-muted text-base text-center leading-relaxed">
                {q
                  ? 'No counsellors match that search.'
                  : 'No counsellors listed yet — check back soon.'}
              </Text>
            </View>
          ) : (
            visible.map((e, i) => (
              <Animated.View
                key={e.user_id}
                entering={FadeInDown.duration(300).delay(Math.min(i * 50, 300))}
                className="bg-surface rounded-2xl px-5 py-5 mb-3 border border-white/8"
              >
                <View className="flex-row items-center gap-3 mb-2">
                  <Avatar username={e.username} size="md" />
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2">
                      <Text className="text-text-primary text-base font-semibold">
                        {e.username}
                      </Text>
                      <Text className="text-accent text-xs">✓ verified</Text>
                    </View>
                    {!!e.org && (
                      <Text className="text-text-muted text-sm mt-0.5">{e.org}</Text>
                    )}
                  </View>
                </View>

                {!!e.bio && (
                  <Text className="text-text-secondary text-sm leading-relaxed mb-3">
                    {e.bio}
                  </Text>
                )}

                {(e.website_url || e.booking_url) && (
                  <View className="flex-row gap-2">
                    {!!e.website_url && (
                      <Pressable
                        onPress={() => open(e.website_url!)}
                        className="flex-1 items-center py-2.5 rounded-xl bg-surface-2 border border-white/10 active:border-white/25"
                      >
                        <Text className="text-text-secondary text-sm font-semibold">
                          Website
                        </Text>
                      </Pressable>
                    )}
                    {!!e.booking_url && (
                      <Pressable
                        onPress={() => open(e.booking_url!)}
                        className="flex-1 items-center py-2.5 rounded-xl bg-accent active:bg-accent-dark"
                      >
                        <Text className="text-bg text-sm font-semibold">Book a session</Text>
                      </Pressable>
                    )}
                  </View>
                )}
              </Animated.View>
            ))
          )}

          <Text className="text-text-muted text-xs leading-relaxed mt-4">
            Every listing is a verified professional account. Alchono doesn't
            take a cut of bookings and doesn't endorse individual
            practitioners — always check credentials that matter to you.
          </Text>
        </ScrollView>
      )}
    </View>
  );
}
