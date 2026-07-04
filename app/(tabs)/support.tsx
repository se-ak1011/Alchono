import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, Linking, Platform } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { SafeArea } from '@/components/ui/SafeArea';
import { headingShadow } from '@/styles';
import { AiCoachChat } from '@/components/support/AiCoachChat';
import { CommunityFeed } from '@/components/support/CommunityFeed';
import { MentorList } from '@/components/support/MentorList';
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

type Resource = {
  title: string;
  description: string;
  action: string;
  url: string;
};

const RESOURCE_SECTIONS: { heading: string; items: Resource[] }[] = [
  {
    heading: 'Right now',
    items: [
      {
        title: 'Emergency — 999',
        description: 'Medical emergency, danger to yourself or others.',
        action: 'Call 999',
        url: 'tel:999',
      },
      {
        title: 'Samaritans',
        description: 'Whatever you are going through. Free, 24/7, confidential.',
        action: 'Call 116 123',
        url: 'tel:116123',
      },
      {
        title: 'Shout',
        description: 'Free 24/7 crisis support by text, if talking feels like too much.',
        action: 'Text SHOUT to 85258',
        url: Platform.OS === 'ios' ? 'sms:85258&body=SHOUT' : 'sms:85258?body=SHOUT',
      },
      {
        title: 'NHS 111',
        description: 'Urgent mental health support — choose the mental health option.',
        action: 'Call 111',
        url: 'tel:111',
      },
    ],
  },
  {
    heading: 'Alcohol support',
    items: [
      {
        title: 'Drinkline',
        description: 'The national alcohol helpline. Free and confidential advice, weekdays 9am–8pm, weekends 11am–4pm.',
        action: 'Call 0300 123 1110',
        url: 'tel:03001231110',
      },
      {
        title: 'Alcoholics Anonymous',
        description: 'Free helpline and meetings across the UK, run by people in recovery.',
        action: 'Call 0800 9177 650',
        url: 'tel:08009177650',
      },
      {
        title: 'AA meeting finder',
        description: 'Find an AA meeting near you, in person or online.',
        action: 'Open website',
        url: 'https://www.alcoholics-anonymous.org.uk/aa-meetings/find-a-meeting',
      },
      {
        title: 'SMART Recovery UK',
        description: 'Science-based mutual aid meetings — an alternative to 12-step.',
        action: 'Open website',
        url: 'https://smartrecovery.org.uk',
      },
      {
        title: 'NHS alcohol advice',
        description: 'Cutting down, risks, and where to get local treatment.',
        action: 'Open website',
        url: 'https://www.nhs.uk/live-well/alcohol-advice/',
      },
    ],
  },
  {
    heading: 'For the people around you',
    items: [
      {
        title: 'Al-Anon',
        description: 'Support for family and friends affected by someone else’s drinking.',
        action: 'Call 0800 0086 811',
        url: 'tel:08000086811',
      },
      {
        title: 'NACOA',
        description: 'For anyone affected by a parent’s drinking — at any age.',
        action: 'Call 0800 358 3456',
        url: 'tel:08003583456',
      },
    ],
  },
  {
    heading: 'Professional help',
    items: [
      {
        title: 'Find a counsellor',
        description: 'Verified recovery professionals on Alchono — websites and booking links included.',
        action: 'Browse the directory',
        url: 'internal:/counsellors',
      },
    ],
  },
  {
    heading: 'Talk online',
    items: [
      {
        title: '7 Cups',
        description: 'Free, anonymous chat with trained listeners.',
        action: 'Open website',
        url: 'https://www.7cups.com',
      },
    ],
  },
  {
    heading: 'More than alcohol?',
    items: [
      {
        title: 'Recovery ecosystem',
        description:
          'Struggling with smoking, gambling, or something else too? Sister apps to Alchono are on the way.',
        action: "See what's coming",
        url: 'internal:/ecosystem',
      },
    ],
  },
];

const SWAPS_SECTION = {
  heading: 'Swap, don’t fight',
  items: [
    {
      title: 'Alcohol-free alternatives',
      description: 'Same ritual, same glass, zero alcohol — 0.0 beers, spirits, and fizz that actually taste right.',
      action: 'See the list',
      url: 'internal:/swaps',
    },
  ],
};

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
