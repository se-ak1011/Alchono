import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import {
  useConnections,
  useMentorInbox,
  useRespondToRequest,
} from '@/hooks/useMessages';

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export default function MessagesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: connections, isLoading } = useConnections();
  const { data: inbox } = useMentorInbox();
  const { mutate: respond, isPending: isResponding } = useRespondToRequest();

  return (
    <View
      className="flex-1 bg-bg"
      style={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom }}
    >
      <View className="flex-row items-center px-6 mb-6">
        <Pressable onPress={() => router.back()} className="mr-4" hitSlop={12}>
          <Text className="text-text-secondary text-lg">←</Text>
        </Pressable>
        <Text className="text-text-primary text-lg font-semibold">Messages</Text>
      </View>

      {isLoading ? (
        <LoadingSpinner message="Loading…" />
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Pending requests — mentors only */}
          {!!inbox?.length && (
            <View className="mb-8">
              <Text className="text-text-muted text-sm font-semibold tracking-widest uppercase mb-3">
                Requests
              </Text>
              {inbox.map((req, i) => (
                <Animated.View
                  key={req.id}
                  entering={FadeInDown.duration(300).delay(i * 50)}
                  className="bg-surface rounded-2xl px-5 py-5 mb-3 border border-white/10"
                >
                  <View className="flex-row items-center gap-3 mb-3">
                    <Avatar username={req.requesterUsername} size="md" />
                    <View className="flex-1">
                      <Text className="text-text-primary text-base font-semibold">
                        {req.requesterUsername}
                      </Text>
                      <Text className="text-text-muted text-sm mt-0.5">
                        wants to connect · {timeAgo(req.created_at)}
                      </Text>
                    </View>
                  </View>
                  {req.message && (
                    <Text className="text-text-secondary text-base leading-relaxed mb-4">
                      “{req.message}”
                    </Text>
                  )}
                  <View className="flex-row gap-2">
                    <Button
                      title="Decline"
                      variant="secondary"
                      size="sm"
                      className="flex-1"
                      disabled={isResponding}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        respond({ requestId: req.id, accept: false });
                      }}
                    />
                    <Button
                      title="Accept"
                      variant="primary"
                      size="sm"
                      className="flex-1"
                      disabled={isResponding}
                      onPress={() => {
                        Haptics.notificationAsync(
                          Haptics.NotificationFeedbackType.Success,
                        );
                        respond({ requestId: req.id, accept: true });
                      }}
                    />
                  </View>
                </Animated.View>
              ))}
            </View>
          )}

          {/* Conversations */}
          <Text className="text-text-muted text-sm font-semibold tracking-widest uppercase mb-3">
            Conversations
          </Text>
          {connections?.length ? (
            connections.map((c, i) => (
              <Animated.View
                key={c.requestId}
                entering={FadeInDown.duration(300).delay(i * 40)}
              >
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push({
                      pathname: '/messages/[requestId]',
                      params: {
                        requestId: c.requestId,
                        username: c.otherUsername,
                        otherUserId: c.otherUserId,
                      },
                    } as any);
                  }}
                  className="flex-row items-center gap-3 bg-surface rounded-2xl px-5 py-4 mb-3 border border-white/5 active:border-white/15"
                >
                  <Avatar username={c.otherUsername} size="md" />
                  <View className="flex-1">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-text-primary text-base font-semibold">
                        {c.otherUsername}
                      </Text>
                      {c.lastMessage && (
                        <Text className="text-text-muted text-sm">
                          {timeAgo(c.lastMessage.created_at)}
                        </Text>
                      )}
                    </View>
                    <View className="flex-row items-center justify-between mt-0.5">
                      <Text
                        className={`text-sm flex-1 mr-3 ${
                          c.unreadCount > 0 ? 'text-text-secondary font-medium' : 'text-text-muted'
                        }`}
                        numberOfLines={1}
                      >
                        {c.lastMessage?.content ??
                          (c.iAmMentor ? 'You accepted — say hi.' : 'Connected — say hi.')}
                      </Text>
                      {c.unreadCount > 0 && (
                        <View className="bg-accent rounded-full min-w-5 h-5 px-1.5 items-center justify-center">
                          <Text className="text-bg text-xs font-bold">{c.unreadCount}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </Pressable>
              </Animated.View>
            ))
          ) : (
            <View className="py-12 items-center px-6">
              <Text className="text-text-muted text-base text-center leading-relaxed">
                No conversations yet.{'\n'}
                Connect with a mentor from the Support tab — once they accept,
                you can talk here.
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}
