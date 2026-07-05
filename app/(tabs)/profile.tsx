import React from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { SafeArea } from '@/components/ui/SafeArea';
import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore } from '@/store/authStore';
import { headingShadow } from '@/styles';

/**
 * A described navigation card. Unlike a bare settings row, it says what the
 * feature is *for* — so care team / mentoring / trusted person are discoverable
 * rather than lost in a list nobody reads.
 */
function HubCard({
  title,
  subtitle,
  onPress,
  elevated = false,
}: {
  title: string;
  subtitle?: string;
  onPress: () => void;
  elevated?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center gap-4 rounded-2xl px-5 py-4 mb-3 border ${
        elevated ? 'bg-surface-2 border-white/10' : 'bg-surface border-white/5'
      } active:opacity-80`}
    >
      <View className="flex-1">
        <Text className="text-text-primary text-base font-semibold">{title}</Text>
        {subtitle ? (
          <Text className="text-text-secondary text-sm mt-1 leading-relaxed">
            {subtitle}
          </Text>
        ) : null}
      </View>
      <Feather name="chevron-right" size={18} color="#666270" />
    </Pressable>
  );
}

export default function ProfileScreen() {
  const profile = useAuthStore((s) => s.profile);
  const user = useAuthStore((s) => s.user);
  const router = useRouter();

  return (
    <SafeArea>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View className="px-6 pt-5 pb-4 flex-row items-start justify-between">
          <Text
            className="text-text-primary text-3xl font-semibold tracking-tight"
            style={headingShadow}
          >
            Profile
          </Text>
          <Pressable
            onPress={() => router.push('/settings')}
            hitSlop={12}
            className="mt-1 p-2 -mr-2 active:opacity-60"
          >
            <Feather name="settings" size={22} color="#9B98A8" />
          </Pressable>
        </View>

        {/* Identity */}
        <Pressable
          onPress={() => router.push('/profile/identity')}
          className="mx-6 flex-row items-center gap-4 mb-8 active:opacity-70"
        >
          <Avatar username={profile?.username} imageUrl={profile?.avatar_url} size="lg" />
          <View className="flex-1">
            <View className="flex-row items-center gap-2">
              <Text className="text-text-primary text-xl font-semibold">
                {profile?.username ?? 'Anonymous'}
              </Text>
              <Text className="text-text-muted text-sm">✎</Text>
            </View>
            <Text className="text-text-muted text-base mt-0.5">{user?.email}</Text>
          </View>
        </Pressable>

        {/* Your circle — the people and support around your recovery */}
        <Text className="text-text-muted text-xs font-medium tracking-widest uppercase mb-2.5 ml-7">
          Your circle
        </Text>
        <View className="mx-6">
          <HubCard
            elevated
            title="Care team"
            subtitle="Let a counsellor see your trends — check-ins, alcohol-free days, tough moments you got through. Never your journals, messages, or AI chats."
            onPress={() => router.push('/profile/care-team')}
          />
          <HubCard
            title={profile?.is_mentor ? 'Your mentoring' : 'Support someone else'}
            subtitle={
              profile?.is_mentor
                ? "People you're walking alongside."
                : 'Been through it? Become a mentor for someone earlier on the road.'
            }
            onPress={() => router.push('/profile/become-mentor')}
          />
          <HubCard
            title="Trusted person"
            subtitle="Someone who gets a quiet heads-up on a hard day."
            onPress={() => router.push('/profile/trusted')}
          />
          <HubCard
            title="Messages"
            subtitle="Your conversations and connection requests."
            onPress={() => router.push('/messages')}
          />
        </View>

        {/* About you */}
        <Text className="text-text-muted text-xs font-medium tracking-widest uppercase mb-2.5 mt-6 ml-7">
          About you
        </Text>
        <View className="mx-6">
          <HubCard
            title="Your circumstances"
            subtitle="Family, work, location — helps your coach meet you where you are."
            onPress={() => router.push('/profile/preferences')}
          />
          <HubCard
            title="Things I enjoy"
            subtitle="Hobbies and interests — helps personalise your experience over time."
            onPress={() => router.push('/profile/hobbies')}
          />
          <HubCard
            title="Struggling with something else too?"
            subtitle="Other things that can travel alongside drinking."
            onPress={() => router.push('/ecosystem' as any)}
          />
        </View>
      </ScrollView>
    </SafeArea>
  );
}
