import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { SafeArea } from '@/components/ui/SafeArea';
import { SosButton } from '@/components/support/SosButton';
import { AiCoachChat } from '@/components/support/AiCoachChat';
import { CommunityFeed } from '@/components/support/CommunityFeed';
import { MentorList } from '@/components/support/MentorList';

type Tab = 'coach' | 'community' | 'mentors';

const TABS: { key: Tab; label: string }[] = [
  { key: 'coach', label: 'AI Coach' },
  { key: 'community', label: 'Community' },
  { key: 'mentors', label: 'Mentors' },
];

export default function SupportScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('coach');

  return (
    <SafeArea bottom={false}>
      <View className="px-6 pt-4 pb-3">
        <Text className="text-text-primary text-2xl font-bold tracking-tight">
          Support
        </Text>
        <Text className="text-text-secondary text-sm mt-1">
          You're not doing this alone.
        </Text>
      </View>

      <SosButton />

      {/* Sub-navigation */}
      <View className="flex-row mx-6 mb-4 bg-surface rounded-xl p-1">
        {TABS.map((tab) => (
          <Pressable
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            className={`flex-1 py-2 rounded-lg items-center ${
              activeTab === tab.key ? 'bg-surface-2' : ''
            }`}
          >
            <Text
              className={`text-xs font-semibold ${
                activeTab === tab.key ? 'text-text-primary' : 'text-text-muted'
              }`}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View className="flex-1">
        {activeTab === 'coach' && <AiCoachChat />}
        {activeTab === 'community' && <CommunityFeed />}
        {activeTab === 'mentors' && <MentorList />}
      </View>
    </SafeArea>
  );
}
