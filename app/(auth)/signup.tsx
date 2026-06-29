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
import { Link } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { MaskIcon } from '@/components/icons/MaskIcon';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useSignUp } from '@/hooks/useAuth';

type FormValues = {
  email: string;
  password: string;
  username: string;
};

export default function SignupScreen() {
  const insets = useSafeAreaInsets();
  const signUp = useSignUp();
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>();

  const onSubmit = async ({ email, password, username }: FormValues) => {
    setLoading(true);
    try {
      await signUp(email.trim().toLowerCase(), password, username.trim());
      Alert.alert(
        'Check your email',
        'We sent a confirmation link. Click it to activate your account.',
      );
    } catch (err: any) {
      Alert.alert('Could not create account', err?.message ?? 'Please try again.');
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
              <MaskIcon size={52} gradient />
              <Text className="text-text-primary text-3xl font-bold tracking-tight mt-4">
                Start here.
              </Text>
              <Text className="text-text-secondary text-base mt-2 text-center leading-relaxed">
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
              name="username"
              rules={{
                required: 'Choose a username',
                minLength: { value: 2, message: 'At least 2 characters' },
                maxLength: { value: 30, message: 'Max 30 characters' },
                pattern: {
                  value: /^[a-zA-Z0-9_]+$/,
                  message: 'Letters, numbers and underscores only',
                },
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Username"
                  placeholder="How you'll appear in the community"
                  autoCapitalize="none"
                  autoCorrect={false}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                  error={errors.username?.message}
                  hint="This is your only public identifier"
                />
              )}
            />
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
                />
              )}
            />
            <Controller
              control={control}
              name="password"
              rules={{
                required: 'Password is required',
                minLength: { value: 8, message: 'At least 8 characters' },
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Password"
                  placeholder="8+ characters"
                  secureTextEntry
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                  error={errors.password?.message}
                />
              )}
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(500).delay(300)} className="mb-4">
            <Button
              title="Create account"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              onPress={handleSubmit(onSubmit)}
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(500).delay(350)}>
            <Text className="text-text-muted text-xs text-center leading-relaxed mb-4">
              Your data is private and never sold. You can export or delete everything at any time.
            </Text>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.duration(500).delay(400)}
            className="flex-row justify-center"
          >
            <Text className="text-text-secondary text-sm">Already have an account? </Text>
            <Link href="/(auth)/login" asChild>
              <Pressable>
                <Text className="text-accent text-sm font-semibold">Sign in</Text>
              </Pressable>
            </Link>
          </Animated.View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
