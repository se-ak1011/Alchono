import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
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
import { SoulIcon } from '@/components/icons/SoulIcon';
import { headingShadow } from '@/styles';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useSignIn } from '@/hooks/useAuth';

type FormValues = {
  email: string;
  password: string;
};

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const signIn = useSignIn();
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>();

  const onSubmit = async ({ email, password }: FormValues) => {
    setLoading(true);
    try {
      await signIn(email.trim().toLowerCase(), password);
    } catch (err: any) {
      Alert.alert(
        'Sign in failed',
        err?.message ?? 'Check your email and password.',
      );
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
              <SoulIcon size={52} />
              <Text className="text-text-primary text-3xl font-semibold tracking-tight mt-4" style={headingShadow}>
                Welcome back.
              </Text>
              <Text className="text-text-secondary text-base mt-2 text-center">
                Your journey continues here.
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
              rules={{ required: 'Email is required' }}
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
              rules={{ required: 'Password is required' }}
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Password"
                  placeholder="Your password"
                  secureTextEntry
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                  error={errors.password?.message}
                />
              )}
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(500).delay(300)}>
            <Button
              title="Sign in"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              onPress={handleSubmit(onSubmit)}
            />
          </Animated.View>

          <Animated.View
            entering={FadeInDown.duration(500).delay(400)}
            className="flex-row justify-center mt-6"
          >
            <Text className="text-text-secondary text-sm">
              New here?{' '}
            </Text>
            <Link href="/(auth)/signup" asChild>
              <Pressable>
                <Text className="text-accent text-sm font-semibold">
                  Create account
                </Text>
              </Pressable>
            </Link>
          </Animated.View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
