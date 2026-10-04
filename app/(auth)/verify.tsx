import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SoulIcon } from '@/components/icons/SoulIcon';
import { headingShadow } from '@/styles';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useVerifyOtp, useSendOtp } from '@/hooks/useAuth';

export default function VerifyScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const verifyOtp = useVerifyOtp();
  const sendOtp = useSendOtp();

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resending, setResending] = useState(false);

  const onVerify = async () => {
    const token = code.trim();
    if (token.length < 6 || !email) {
      setError('Enter the 6-digit code from your email.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await verifyOtp(email, token);
      // AuthGate takes it from here once the session lands (onboarding or home).
    } catch (err: any) {
      setError(err?.message ?? 'That code didn’t work. Try again or resend.');
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    if (!email) return;
    setResending(true);
    try {
      await sendOtp(email);
      Alert.alert('Code sent', `We’ve emailed a fresh code to ${email}.`);
    } catch (err: any) {
      Alert.alert('Could not resend', err?.message ?? 'Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-bg"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 px-6 justify-center">
          <Animated.View entering={FadeInDown.duration(500).delay(100)}>
            <View className="items-center mb-10">
              <SoulIcon size={64} />
              <Text className="text-text-primary text-4xl font-semibold tracking-tight mt-4" style={headingShadow}>
                Check your email
              </Text>
              <Text className="text-text-secondary text-lg mt-2 text-center leading-relaxed">
                We sent a 6-digit code to{'\n'}
                <Text className="text-text-primary font-semibold">{email}</Text>
              </Text>
            </View>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.duration(500).delay(200)}
            className="gap-2 mb-6"
          >
            <Input
              label="Your code"
              placeholder="123456"
              keyboardType="number-pad"
              autoFocus
              maxLength={6}
              textContentType="oneTimeCode"
              value={code}
              onChangeText={(t) => {
                setCode(t.replace(/[^0-9]/g, ''));
                if (error) setError('');
              }}
              error={error || undefined}
              className="tracking-[8px]"
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(500).delay(300)} className="mb-4">
            <Button
              title="Verify & continue"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              onPress={onVerify}
            />
          </Animated.View>

          <Animated.View
            entering={FadeInDown.duration(500).delay(400)}
            className="items-center gap-4 mt-2"
          >
            <Pressable onPress={onResend} disabled={resending} hitSlop={8}>
              <Text className="text-accent text-base font-semibold">
                {resending ? 'Sending…' : 'Resend code'}
              </Text>
            </Pressable>
            <Pressable onPress={() => router.back()} hitSlop={8}>
              <Text className="text-text-muted text-sm">Wrong email? Go back</Text>
            </Pressable>
          </Animated.View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
