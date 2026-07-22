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
import { SoulIcon } from '@/components/icons/SoulIcon';
import { headingShadow } from '@/styles';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useSignUp } from '@/hooks/useAuth';

type FormValues = {
  email: string;
  password: string;
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

  const onSubmit = async ({ email, password }: FormValues) => {
    setLoading(true);
    try {
      await signUp(email.trim().toLowerCase(), password);
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
              <SoulIcon size={64} />
              <Text className="text-text-primary text-4xl font-semibold tracking-tight mt-4" style={headingShadow}>
                Start here.
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
