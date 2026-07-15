import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeArea } from '@/components/ui/SafeArea';
import { MentorList } from '@/components/support/MentorList';
import { headingShadow } from '@/styles';

export default function MentorsScreen() {
  const router = useRouter();
  return (
    <SafeArea bottom={false}>
      <View className="flex-row items-center gap-4 px-6 pt-4 pb-3">
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={{ color: '#8E8798', fontSize: 18 }}>←</Text>
        </Pressable>
        <View className="flex-1">
          <Text
            className="text-text-primary text-2xl font-semibold tracking-tight"
            style={headingShadow}
          >
            Mentors
          </Text>
          <Text className="text-text-muted text-sm mt-0.5">
            People who've walked it, a message away.
          </Text>
        </View>
      </View>
      <View className="flex-1">
        <MentorList />
      </View>
    </SafeArea>
  );
}
