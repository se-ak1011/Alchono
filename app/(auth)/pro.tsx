import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useSignUp } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';
import { headingShadow } from '@/styles';

export default function ProSignupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const signUp = useSignUp();
  const setProfile = useAuthStore((s) => s.setProfile);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [org, setOrg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!email.trim() || password.length < 8 || username.trim().length < 3) {
      Alert.alert('Check the details', 'Email, a username (3+ chars), and a password of 8+ characters.');
      return;
    }
    setLoading(true);
    try {
      const { user } = await signUp(email.trim().toLowerCase(), password);
      if (!user) throw new Error('Could not create the account.');

      // Professional role: skip member onboarding, register unverified.
      // Username is saved here now that useSignUp no longer takes one.
      const { data: updated, error: profErr } = await (supabase as any)
        .from('profiles')
        .update({ is_professional: true, onboarding_completed: true, username: username.trim() })
        .eq('id', user.id)
        .select()
        .maybeSingle();
      if (profErr) throw profErr;

      const { error: proErr } = await (supabase as any)
        .from('professionals')
        .insert({ user_id: user.id, org: org.trim() || null, verified: false });
      if (proErr && proErr.code !== '23505') throw proErr;

      if (updated) setProfile(updated as any);
      router.replace('/pro' as any);
    } catch (e) {
      Alert.alert('Could not sign up', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-bg"
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 24,
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + 24,
          justifyContent: 'center',
        }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <Text className="text-text-primary text-3xl font-semibold mb-2" style={headingShadow}>
          For counsellors.
        </Text>
        <Text className="text-text-secondary text-base leading-relaxed mb-8">
          A consent-first window into how your clients are coping between
          sessions — trends only, never their journals or conversations.
          Accounts are verified by hand before any access.
        </Text>

        <View style={{ gap: 14 }}>
          <Input label="Work email" value={email} onChangeText={setEmail}
            autoCapitalize="none" keyboardType="email-address" autoCorrect={false} />
          <Input label="Username (clients will see this)" value={username}
            onChangeText={setUsername} autoCapitalize="none" autoCorrect={false} />
          <Input label="Organisation (optional)" value={org} onChangeText={setOrg} />
          <Input label="Password" value={password} onChangeText={setPassword}
            secureTextEntry autoCapitalize="none" />
        </View>

        <View className="mt-8">
          <Button
            title="Create professional account"
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            onPress={handleSignUp}
          />
        </View>

        <Pressable onPress={() => router.back()} className="mt-6 items-center" hitSlop={8}>
          <Text className="text-text-muted text-base">← Back</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
