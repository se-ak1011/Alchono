import React, { useMemo, useState } from 'react';
import { View, Alert, Share, Linking, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useQuery, useMutation } from '@tanstack/react-query';
import { DrawnForm, FieldZone, TickZone, UsernameZone, type Rect } from '@/components/paper/DrawnForm';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';
import type { UserPreferences } from '@/types';

/**
 * The Personal File — Marta's hand-drawn desk drawer, opened from the folder
 * icon on every view (and the room drawers). Everything the old "app" profile
 * pages held, laid out as real objects in one drawer you write straight into:
 *   • the wallet ID card — username + location
 *   • the paperclipped notes — family, pets, job, emergency contact
 *   • the PDA — the six notification toggles, ticked in place
 *   • the wax-sealed PRIVACY envelope — opens the privacy close-up
 * Zones are placed roughly here; the pencil editor lets her drag + Export the
 * exact rects, same art→coordinates workflow as the rooms and books.
 */

const deskDrawer = require('../../assets/folder/profile-desk.png');
const privacyNote = require('../../assets/folder/profile-privacy.png');

type FileNotes = {
  family?: string; pets?: string; job?: string; emergency?: string;
  trustedName?: string; trustedContact?: string;
};

// The 6 notification toggles — same table + order Marta drew on the PDA.
type NotifKey =
  | 'daily_checkin'
  | 'morning_reflection'
  | 'drinking_reminders'
  | 'session_nudges'
  | 'milestone_alerts'
  | 'community_updates';

// Rough default rects — she'll drag + Export exact positions in the editor.
const R = {
  // wallet ID card (top-left)
  d_username: { x: 0.12, y: 0.235, w: 0.34, h: 0.035 } as Rect,
  d_location: { x: 0.12, y: 0.285, w: 0.34, h: 0.035 } as Rect,
  // paperclipped notes (bottom-left)
  d_family: { x: 0.10, y: 0.545, w: 0.33, h: 0.035 } as Rect,
  d_pets: { x: 0.10, y: 0.610, w: 0.33, h: 0.035 } as Rect,
  d_job: { x: 0.10, y: 0.670, w: 0.33, h: 0.035 } as Rect,
  d_emergency: { x: 0.10, y: 0.735, w: 0.33, h: 0.035 } as Rect,
  // PDA — tick boxes down the right edge of the screen (top-right)
  p_daily_checkin: { x: 0.80, y: 0.315, w: 0.07, h: 0.028 } as Rect,
  p_morning_reflection: { x: 0.80, y: 0.345, w: 0.07, h: 0.028 } as Rect,
  p_drinking_reminders: { x: 0.80, y: 0.375, w: 0.07, h: 0.028 } as Rect,
  p_session_nudges: { x: 0.80, y: 0.410, w: 0.07, h: 0.028 } as Rect,
  p_milestone_alerts: { x: 0.80, y: 0.440, w: 0.07, h: 0.028 } as Rect,
  p_community_updates: { x: 0.80, y: 0.465, w: 0.07, h: 0.028 } as Rect,
  // PRIVACY envelope (bottom-right) — opens the privacy close-up
  d_privacy: { x: 0.53, y: 0.650, w: 0.39, h: 0.150 } as Rect,
  // privacy close-up rows
  pv_export: { x: 0.12, y: 0.500, w: 0.76, h: 0.060 } as Rect,
  pv_policy: { x: 0.12, y: 0.565, w: 0.76, h: 0.060 } as Rect,
} as const;

const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

/** Compose a readable first draft of the free-text blanks from onboarding data. */
function seedFromPrefs(p: UserPreferences): FileNotes {
  const fam: string[] = [];
  if (p.familyMembers?.includes('partner')) fam.push(`Partner${p.partnerName ? ` ${p.partnerName}` : ''}`);
  if (p.familyMembers?.includes('children'))
    fam.push(`${p.childrenCount} child${(p.childrenCount ?? 1) > 1 ? 'ren' : ''}${p.childrenNames ? ` (${p.childrenNames})` : ''}`);
  return {
    family: fam.join(', '),
    pets: p.hasPets ? (p.petName || 'Yes') : '',
    job: p.hasJob ? (p.workShift ? `${cap(p.workShift)} shifts` : 'Yes') : '',
  };
}

export default function PersonalFileScreen() {
  const router = useRouter();
  const { user, profile, setProfile } = useAuthStore();
  const userId = user?.id;

  const basePrefs = (profile?.preferences as Partial<UserPreferences> | undefined) ?? {};
  const seed = useMemo(() => seedFromPrefs(basePrefs as UserPreferences), []);
  const savedNotes = ((basePrefs as any).file ?? {}) as FileNotes;

  const [phase, setPhase] = useState<'desk' | 'privacy'>('desk');

  // Personal details — free-text blanks, seeded from onboarding the first time.
  const [family, setFamily] = useState(savedNotes.family ?? seed.family ?? '');
  const [pets, setPets] = useState(savedNotes.pets ?? seed.pets ?? '');
  const [job, setJob] = useState(savedNotes.job ?? seed.job ?? '');
  const [emergency, setEmergency] = useState(savedNotes.emergency ?? '');
  const [location, setLocation] = useState((basePrefs.city as string) ?? '');

  // Save is best-effort and must NEVER block navigation. We update the
  // in-session profile immediately, then try the remote save in the background
  // — a slow or failed network can't trap you on the page. Trusted-person and
  // hobbies data lives on its own screens, so it's preserved untouched here.
  const saveDetails = async () => {
    if (!user) return;
    const nextPrefs: any = {
      ...basePrefs,
      city: location.trim(),
      file: { ...savedNotes, family, pets, job, emergency },
    };
    if (profile) setProfile({ ...profile, preferences: nextPrefs });
    try {
      const { error } = await (supabase.from('profiles') as any)
        .update({ preferences: nextPrefs })
        .eq('id', user.id);
      if (error) Alert.alert('Saved on device', 'We’ll sync your details when the connection’s back.');
      else Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert('Saved on device', 'We’ll sync your details when the connection’s back.');
    }
  };

  // Notification toggles — live rows in notification_preferences (default on).
  const { data: notif } = useQuery({
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
  const { mutate: updateNotif } = useMutation({
    mutationFn: async ({ key, value }: { key: NotifKey; value: boolean }) => {
      await (supabase.from('notification_preferences') as any)
        .upsert({ user_id: userId!, [key]: value }, { onConflict: 'user_id' });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notification-prefs', userId] }),
  });
  const notifOn = (k: NotifKey) => (notif?.[k] ?? true) as boolean;
  const toggleNotif = (k: NotifKey) => updateNotif({ key: k, value: !notifOn(k) });

  const handleExport = () => {
    Alert.alert('Export data', 'A full copy of your data will be prepared. You can save or share it however you like.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Export',
        onPress: async () => {
          const { data, error } = await supabase.functions.invoke('export-data', { body: { userId } });
          if (error || !data?.data) {
            Alert.alert('Error', 'Could not prepare your export. Please try again.');
            return;
          }
          await Share.share({ title: 'Alchono data export', message: JSON.stringify(data.data, null, 2) });
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <View style={{ flex: 1, backgroundColor: '#0d0b12' }}>
        {phase === 'desk' && (
          <DrawnForm source={deskDrawer} label="profile-desk" onBack={() => { void saveDetails(); router.back(); }}>
            {/* wallet ID card */}
            <UsernameZone id="d_username" rect={R.d_username} fontSize={18} />
            <FieldZone id="d_location" rect={R.d_location} value={location} onChangeText={setLocation} placeholder="City or area" fontSize={16} />
            {/* paperclipped notes */}
            <FieldZone id="d_family" rect={R.d_family} value={family} onChangeText={setFamily} placeholder="Who's at home" fontSize={16} />
            <FieldZone id="d_pets" rect={R.d_pets} value={pets} onChangeText={setPets} placeholder="Any pets?" fontSize={16} />
            <FieldZone id="d_job" rect={R.d_job} value={job} onChangeText={setJob} placeholder="Work" fontSize={16} />
            <FieldZone id="d_emergency" rect={R.d_emergency} value={emergency} onChangeText={setEmergency} placeholder="Name + number" fontSize={16} />
            {/* PDA toggles */}
            <TickZone id="p_daily_checkin" rect={R.p_daily_checkin} value={notifOn('daily_checkin')} onToggle={() => toggleNotif('daily_checkin')} />
            <TickZone id="p_morning_reflection" rect={R.p_morning_reflection} value={notifOn('morning_reflection')} onToggle={() => toggleNotif('morning_reflection')} />
            <TickZone id="p_drinking_reminders" rect={R.p_drinking_reminders} value={notifOn('drinking_reminders')} onToggle={() => toggleNotif('drinking_reminders')} />
            <TickZone id="p_session_nudges" rect={R.p_session_nudges} value={notifOn('session_nudges')} onToggle={() => toggleNotif('session_nudges')} />
            <TickZone id="p_milestone_alerts" rect={R.p_milestone_alerts} value={notifOn('milestone_alerts')} onToggle={() => toggleNotif('milestone_alerts')} />
            <TickZone id="p_community_updates" rect={R.p_community_updates} value={notifOn('community_updates')} onToggle={() => toggleNotif('community_updates')} />
            {/* PRIVACY envelope → the privacy close-up */}
            <LinkZone id="d_privacy" rect={R.d_privacy} onPress={() => setPhase('privacy')} />
          </DrawnForm>
        )}

        {phase === 'privacy' && (
          <DrawnForm source={privacyNote} label="profile-privacy" onBack={() => setPhase('desk')}>
            <LinkZone id="pv_export" rect={R.pv_export} onPress={handleExport} />
            <LinkZone id="pv_policy" rect={R.pv_policy} onPress={() => Linking.openURL('https://se-ak1011.github.io/Alchono/privacy.html')} />
          </DrawnForm>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

/** A tappable row — invisible over the drawn chevron line / sealed envelope. */
function LinkZone({ id, rect, onPress }: { id: string; rect: Rect; onPress: () => void }) {
  return (
    <TickZone id={id} rect={rect} value={false} onToggle={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); }} />
  );
}
