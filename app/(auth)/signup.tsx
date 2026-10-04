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
import { Link, useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SoulIcon } from '@/components/icons/SoulIcon';
import { headingShadow } from '@/styles';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useSendOtp } from '@/hooks/useAuth';

type FormValues = {
  email: string;
};

export default function SignupScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const sendOtp = useSendOtp();
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>();

  const onSubmit = async ({ email }: FormValues) => {
    const clean = email.trim().toLowerCase();
    setLoading(true);
    try {
      await sendOtp(clean);
      router.push({ pathname: '/(auth)/verify', params: { email: clean } });
    } catch (err: any) {
      Alert.alert('Could not send your code', err?.message ?? 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-bg"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 px-6 justify-center">
          <Animated.View entering={FadeInDown.duration(500).delay(100)}>
            <View className="items-center mb-10">
              <SoulIcon size={64} />
              <Text className="text-text-primary text-4xl font-semibold tracking-tight mt-4" style={headingShadow}>
                Start here
              </Text>
              <Text className="text-text-secondary text-lg mt-2 text-center leading-relaxed">
                Private. Compassionate. Yours.
              </Text>
            </View>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.duration(500).delay(200)}
            className="gap-4 mb-6"
          >
            <Controller
              control={control}
              name="email"
              rules={{
                required: 'Email is required',
                pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' },
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Email"
                  placeholder="you@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                  error={errors.email?.message}
                  hint="We'll email you a 6-digit code to get started — no password to remember."
                />
              )}
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(500).delay(300)} className="mb-4">
            <Button
              title="Email me a code"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              onPress={handleSubmit(onSubmit)}
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(500).delay(350)}>
            <Text className="text-text-muted text-sm text-center leading-relaxed mb-4">
              Your data is private and never sold. You can export or delete everything at any time.
            </Text>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.duration(500).delay(400)}
            className="flex-row justify-center"
          >
            <Text className="text-text-secondary text-base">Already have an account? </Text>
            <Link href="/(auth)/login" asChild>
              <Pressable>
                <Text className="text-accent text-base font-semibold">Sign in</Text>
              </Pressable>
            </Link>
          </Animated.View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
