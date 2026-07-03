import React from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { useProfessional, useRequestClient } from '@/hooks/usePro';

/** Landing for scanned member QR codes: alchono://pro/add/{username} */
export default function ProAddClientScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { username } = useLocalSearchParams<{ username: string }>();
  const { data: pro, isLoading } = useProfessional();
  const { mutate: requestClient, isPending } = useRequestClient();

  const notPro = !isLoading && !pro;

  return (
    <View
      className="flex-1 bg-bg items-center justify-center px-8"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      {notPro ? (
        <>
          <Text className="text-text-primary text-xl font-semibold text-center mb-3">
            This QR is for counsellors.
          </Text>
          <Text className="text-text-muted text-base text-center leading-relaxed mb-8">
            It lets a verified recovery professional ask to see someone's
            trends — with their consent.
          </Text>
        </>
      ) : (
        <>
          <Text className="text-text-primary text-xl font-semibold text-center mb-3">
            Ask {username} for access?
          </Text>
          <Text className="text-text-muted text-base text-center leading-relaxed mb-8">
            They'll get a consent request in their app. You'll see trends only
            — never journals or conversations — and only if they approve.
          </Text>
          <Button
            title={isPending ? 'Sending…' : 'Send consent request'}
            variant="primary"
            size="lg"
            fullWidth
            loading={isPending}
            onPress={() =>
              requestClient(username!, {
                onSuccess: () => {
                  Alert.alert('Request sent', 'Waiting on their approval.');
                  router.replace('/pro' as any);
                },
                onError: (e) =>
                  Alert.alert('Could not send', e instanceof Error ? e.message : 'Try again.'),
              })
            }
          />
        </>
      )}
      <Pressable onPress={() => router.back()} className="mt-6" hitSlop={8}>
        <Text className="text-text-muted text-base">← Back</Text>
      </Pressable>
    </View>
  );
}
