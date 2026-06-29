import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';

export default function EmergencyContactsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const profile = useAuthStore((s) => s.profile);
  const userId = useAuthStore((s) => s.user?.id);
  const [name, setName] = useState(profile?.emergency_contact_name ?? '');
  const [phone, setPhone] = useState(profile?.emergency_contact_phone ?? '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          emergency_contact_name: name.trim() || null,
          emergency_contact_phone: phone.trim() || null,
        })
        .eq('id', userId!);

      if (error) throw error;
      Alert.alert('Saved', 'Emergency contact updated.', [
        { text: 'Done', onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert('Error', 'Could not save. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      className="flex-1 bg-bg"
      style={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }}
    >
      <View className="flex-row items-center px-6 mb-6">
        <Pressable onPress={() => router.back()} className="mr-4">
          <Text className="text-text-secondary text-base">←</Text>
        </Pressable>
        <Text className="text-text-primary text-lg font-semibold">
          Emergency contact
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 24 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-text-secondary text-sm leading-relaxed mb-6">
          If you ever tap SOS, this person will not be notified automatically.
          This is for your own reference — a reminder of who to reach out to.
        </Text>

        <View className="gap-4 mb-6">
          <Input
            label="Name"
            placeholder="Their name"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
          <Input
            label="Phone number"
            placeholder="+44 7700 000000"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
        </View>

        <Button
          title="Save"
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
          onPress={handleSave}
        />
      </ScrollView>
    </View>
  );
}
