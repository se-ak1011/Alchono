import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, Linking } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { SafeArea } from '@/components/ui/SafeArea';
import { headingShadow } from '@/styles';
import { AiCoachChat } from '@/components/support/AiCoachChat';
import { CommunityFeed } from '@/components/support/CommunityFeed';
import { MentorList } from '@/components/support/MentorList';
import { RESOURCE_SECTIONS, SWAPS_SECTION } from '@/lib/resources';
import { useUnreadTotal } from '@/hooks/useMessages';
import { useAuthStore } from '@/store/authStore';

type Tab = 'coach' | 'community' | 'mentors' | 'resources';

const TABS: { key: Tab; label: string }[] = [
  { key: 'coach',     label: 'AI Coach' },
  { key: 'community', label: 'Community' },
  { key: 'mentors',   label: 'Mentors' },
  { key: 'resources', label: 'Resources' },
];

export default function SupportScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('coach');
  const { data: unread } = useUnreadTotal();

  return (
    <SafeArea bottom={false}>
      <View className="flex-row items-start justify-between px-6 pt-5 pb-3">
        <View>
          <Text className="text-text-primary text-3xl font-semibold tracking-tight" style={headingShadow}>
            Support
          </Text>
          <Text className="text-text-secondary text-base mt-1">
            You're not doing this alone.
          </Text>
        </View>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/messages');
          }}
          hitSlop={8}
          className="flex-row items-center gap-2 bg-surface rounded-xl px-3.5 py-2.5 border border-white/8 active:border-white/20 mt-1"
        >
          <Text className="text-text-secondary text-sm font-medium">Messages</Text>
          {!!unread && (
            <View className="bg-accent rounded-full min-w-5 h-5 px-1.5 items-center justify-center">
              <Text className="text-bg text-xs font-bold">{unread}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* Urge — always elevated, separate from everything else */}
      <Pressable
        onPress={() => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          router.push('/session/urge');
        }}
        className="mx-6 mb-5 flex-row items-center justify-between bg-urge-surface rounded-2xl px-5 py-5 border border-white/15 active:border-white/35"
        style={{
          shadowColor: '#120D17',
          shadowOpacity: 0.8,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 5 },
        }}
      >
        <View className="flex-1">
          <Text className="text-text-primary text-base font-semibold">
            I want a drink
          </Text>
          <Text className="text-text-muted text-sm mt-1">
            Say it here first. The app will take it from there.
          </Text>
        </View>
        <Text className="text-text-muted text-lg">→</Text>
      </Pressable>

      {/* Toolkit — self-help library, prominent above the sub-nav */}
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push('/toolkit');
        }}
        className="mx-6 mb-5 flex-row items-center justify-between bg-surface rounded-2xl px-5 py-4 border border-white/8 active:border-white/20"
        style={{ borderTopColor: 'rgba(255,255,255,0.12)' }}
      >
        <View className="flex-1 pr-3">
          <Text className="text-text-primary text-base font-semibold">
            Toolkit
          </Text>
          <Text className="text-text-muted text-sm mt-1">
            Small, practical things that help — cravings, triggers, saying no.
          </Text>
        </View>
        <Text className="text-text-muted text-lg">→</Text>
      </Pressable>

      {/* Sub-navigation */}
      <View className="flex-row mx-6 mb-4 bg-surface rounded-xl p-1">
        {TABS.map((tab) => (
          <Pressable
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            className={`flex-1 py-2.5 rounded-lg items-center ${
              activeTab === tab.key ? 'bg-surface-2' : ''
            }`}
          >
            <Text
              className={`text-sm font-semibold ${
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
        {activeTab === 'community' && (
          <CommunityFeed
            onTalkToAi={() => setActiveTab('coach')}
            onFindMentor={() => setActiveTab('mentors')}
          />
        )}
        {activeTab === 'mentors'   && <MentorList />}
        {activeTab === 'resources' && <ResourcesTab />}
      </View>
    </SafeArea>
  );
}

function ResourcesTab() {
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const interested = (profile?.preferences as any)?.interestedInAlternatives === true;
  const sections = interested
    ? [...RESOURCE_SECTIONS, SWAPS_SECTION]
    : RESOURCE_SECTIONS;
  return (
    <ScrollView
      contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeIn.duration(400)}>
        <Text className="text-text-muted text-sm leading-relaxed mb-5">
          UK services. All free unless noted. If you're outside the UK,
          local emergency services are always the right first call.
        </Text>

        {sections.map((section) => (
          <View key={section.heading} className="mb-6">
            <Text className="text-text-muted text-sm font-semibold tracking-widest uppercase mb-3">
              {section.heading}
            </Text>
            {section.items.map((r) => (
              <Pressable
                key={r.title}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  if (r.url.startsWith('internal:')) {
                    router.push(r.url.replace('internal:', '') as any);
                  } else {
                    Linking.openURL(r.url).catch(() => {});
                  }
                }}
                className="bg-surface rounded-2xl px-5 py-4 mb-3 border border-white/5 active:border-white/20"
              >
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="text-text-primary font-semibold text-base flex-1 pr-3">
                    {r.title}
                  </Text>
                  <Text className="text-text-muted text-sm">→</Text>
                </View>
                <Text className="text-text-secondary text-sm leading-relaxed mb-2">
                  {r.description}
                </Text>
                <Text className="text-text-muted text-sm font-medium">{r.action}</Text>
              </Pressable>
            ))}
          </View>
        ))}
      </Animated.View>
    </ScrollView>
  );
}
