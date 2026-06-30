import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { SafeArea } from '@/components/ui/SafeArea';
import { AiCoachChat } from '@/components/support/AiCoachChat';
import { CommunityFeed } from '@/components/support/CommunityFeed';
import { MentorList } from '@/components/support/MentorList';

type Tab = 'coach' | 'community' | 'mentors' | 'resources';

const SUPPORT_STATES = [
  { key: 'talk',     label: 'Just need to talk',  tab: 'coach' as Tab },
  { key: 'urge',     label: 'Feeling the urge',   tab: 'coach' as Tab },
  { key: 'drinking', label: 'Drinking now',        tab: 'coach' as Tab },
  { key: 'through',  label: 'Got through it',      tab: 'community' as Tab },
] as const;

const TABS: { key: Tab; label: string }[] = [
  { key: 'coach',     label: 'AI Coach' },
  { key: 'community', label: 'Community' },
  { key: 'mentors',   label: 'Mentors' },
  { key: 'resources', label: 'Resources' },
];

export default function SupportScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('coach');
  const [activeState, setActiveState] = useState<string | null>(null);

  const handleStateSelect = (state: typeof SUPPORT_STATES[number]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveState(state.key);
    setActiveTab(state.tab);
  };

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

      {/* What's happening right now */}
      <View className="px-6 mb-4">
        <Text className="text-text-muted text-xs font-medium tracking-wide uppercase mb-3">
          Right now?
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {SUPPORT_STATES.map((state) => (
            <Pressable
              key={state.key}
              onPress={() => handleStateSelect(state)}
              className={`px-3 py-2.5 rounded-lg border ${
                activeState === state.key
                  ? 'bg-surface border-white/25'
                  : 'bg-surface border-white/8'
              }`}
            >
              <Text
                className={`text-sm font-medium ${
                  activeState === state.key ? 'text-text-primary' : 'text-text-muted'
                }`}
              >
                {state.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

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
        {activeTab === 'coach'     && <AiCoachChat />}
        {activeTab === 'community' && <CommunityFeed />}
        {activeTab === 'mentors'   && <MentorList />}
        {activeTab === 'resources' && <ResourcesPlaceholder />}
      </View>
    </SafeArea>
  );
}

function ResourcesPlaceholder() {
  const RESOURCES = [
    { icon: '—', title: 'Crisis lines', description: 'Immediate phone support, 24/7.' },
    { icon: '○', title: 'Local meetings', description: 'AA, SMART Recovery, and more near you.' },
    { icon: '◇', title: 'Treatment options', description: 'Detox, rehab, and outpatient programmes.' },
    { icon: '→', title: 'Self-help tools', description: 'Guided exercises and reading.' },
  ];

  return (
    <ScrollView
      contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeIn.duration(400)}>
        {RESOURCES.map((r) => (
          <View
            key={r.title}
            className="flex-row items-start gap-4 bg-surface rounded-2xl px-4 py-4 mb-3 border border-white/5"
          >
            <Text className="text-text-muted text-sm font-semibold w-4 mt-0.5">{r.icon}</Text>
            <View className="flex-1">
              <Text className="text-text-primary font-semibold text-sm mb-0.5">
                {r.title}
              </Text>
              <Text className="text-text-secondary text-sm leading-relaxed">
                {r.description}
              </Text>
              <Text className="text-text-muted text-xs mt-2">Coming soon</Text>
            </View>
          </View>
        ))}
      </Animated.View>
    </ScrollView>
  );
}
