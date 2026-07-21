import React from 'react';
import { View, Text, Switch } from 'react-native';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';
import { useAuthStore } from '@/store/authStore';

type PrefKey =
  | 'daily_checkin'
  | 'drinking_reminders'
  | 'session_nudges'
  | 'milestone_alerts'
  | 'morning_reflection'
  | 'community_updates';

const NOTIF_ITEMS: { key: PrefKey; label: string; description: string }[] = [
  { key: 'daily_checkin', label: 'Daily check-in', description: 'Gentle morning reminder' },
  { key: 'morning_reflection', label: 'Morning reflection', description: 'Prompt after a session' },
  { key: 'drinking_reminders', label: 'Pause reminders', description: 'Support during a session' },
  { key: 'session_nudges', label: 'Slow-down nudges', description: 'Gentle buzzes to pace yourself while drinking' },
  { key: 'milestone_alerts', label: 'Milestones', description: 'Celebrate your progress' },
  { key: 'community_updates', label: 'Community', description: 'Replies and reactions' },
];

export function NotificationSettings() {
  const userId = useAuthStore((s) => s.user?.id);

  const { data: prefs } = useQuery({
    queryKey: ['notification-prefs', userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId!)
        .maybeSingle();
      return data;
    },
    enabled: !!userId,
  });

  const { mutate: updatePref } = useMutation({
    mutationFn: async ({ key, value }: { key: PrefKey; value: boolean }) => {
      await supabase
        .from('notification_preferences')
        .upsert({ user_id: userId!, [key]: value }, { onConflict: 'user_id' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-prefs', userId] });
    },
  });

  return (
    <View className="mx-6 mb-4">
      <Text className="text-text-muted text-xs font-medium tracking-widest uppercase mb-2 ml-1">
        Notifications
      </Text>
      <View className="bg-surface rounded-2xl overflow-hidden border border-white/5">
        {NOTIF_ITEMS.map((item, i) => (
          <React.Fragment key={item.key}>
            {i > 0 && <View className="h-px bg-white/5 mx-4" />}
            <View className="flex-row items-center px-4 py-3.5">
              <View className="flex-1">
                <Text className="text-text-primary text-sm font-medium">
                  {item.label}
                </Text>
                <Text className="text-text-muted text-xs mt-0.5">
                  {item.description}
                </Text>
              </View>
              <Switch
                value={prefs?.[item.key] ?? true}
                onValueChange={(value) => updatePref({ key: item.key, value })}
                trackColor={{ false: '#474151', true: '#A489DE' }}
                thumbColor="#ECE9F1"
              />
            </View>
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}
