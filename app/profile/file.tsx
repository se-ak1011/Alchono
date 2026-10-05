import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, Alert, Share, Linking, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useQuery, useMutation } from '@tanstack/react-query';
import { DrawnForm, FieldZone, TickZone, UsernameZone, type Rect } from '@/components/paper/DrawnForm';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';
import type { UserPreferences } from '@/types';

/**
 * The Personal File — Marta's hand-drawn folder in the Me room. The old
 * "app" pages (My circumstances, notification settings, the privacy list)
 * folded into one purple folder you open, with two papers inside:
 *   1. Personal Details — written into the drawn blanks.
 *   2. Preferences & Permissions — a 00s-style consent form you tick.
 * Zones are placed roughly here; the pencil editor lets her drag + Export
 * the exact rects, same art→coordinates workflow as the rooms and books.
 */

const folderClosed = require('../../assets/folder/personal-file-closed.png');
const detailsPaper = require('../../assets/folder/personal-details.png');
const prefsPaper = require('../../assets/folder/preferences.png');

type FileNotes = { family?: string; pets?: string; job?: string; trustedName?: string; trustedContact?: string };

// The 6 notification toggles — same table + order Marta drew on the consent form.
type NotifKey =
  | 'daily_checkin'
  | 'morning_reflection'
  | 'drinking_reminders'
  | 'session_nudges'
  | 'milestone_alerts'
  | 'community_updates';

// Rough default rects — she'll drag + Export exact positions in the editor.
const R = {
  // cover
  cover_name: { x: 0.163, y: 0.214, w: 0.655, h: 0.073 } as Rect,
  // details paper
  d_username: { x: 0.213, y: 0.176, w: 0.5, h: 0.045 } as Rect,
  d_family: { x: 0.219, y: 0.293, w: 0.55, h: 0.045 } as Rect,
  d_pets: { x: 0.218, y: 0.366, w: 0.58, h: 0.045 } as Rect,
  d_job: { x: 0.207, y: 0.439, w: 0.6, h: 0.045 } as Rect,
  d_location: { x: 0.208, y: 0.513, w: 0.53, h: 0.045 } as Rect,
  d_trustedName: { x: 0.126, y: 0.633, w: 0.55, h: 0.045 } as Rect,
  d_trustedContact: { x: 0.111, y: 0.707, w: 0.54, h: 0.045 } as Rect,
  d_hobbies: { x: 0.116, y: 0.814, w: 0.76, h: 0.08 } as Rect,
  // preferences paper — tick boxes down the right edge
  p_daily_checkin: { x: 0.788, y: 0.226, w: 0.12, h: 0.064 } as Rect,
  p_morning_reflection: { x: 0.789, y: 0.29, w: 0.128, h: 0.065 } as Rect,
  p_drinking_reminders: { x: 0.794, y: 0.356, w: 0.117, h: 0.065 } as Rect,
  p_session_nudges: { x: 0.794, y: 0.423, w: 0.119, h: 0.063 } as Rect,
  p_milestone_alerts: { x: 0.798, y: 0.49, w: 0.112, h: 0.065 } as Rect,
  p_community_updates: { x: 0.794, y: 0.558, w: 0.127, h: 0.067 } as Rect,
  // preferences paper — privacy rows (whole row tappable)
  p_emergency: { x: 0.126, y: 0.688, w: 0.76, h: 0.045 } as Rect,
  p_export: { x: 0.122, y: 0.741, w: 0.76, h: 0.045 } as Rect,
  // Lifted from the exported y:0.91 (floated below the page) up onto the
  // actual "Privacy policy" row, matching the emergency/export row spacing.
  p_privacy: { x: 0.12, y: 0.794, w: 0.76, h: 0.045 } as Rect,
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
    trustedName: '',
    trustedContact: '',
  };
}

export default function PersonalFileScreen() {
  const router = useRouter();
  const { user, profile, setProfile } = useAuthStore();
  const userId = user?.id;

  const basePrefs = (profile?.preferences as Partial<UserPreferences> | undefined) ?? {};
  const seed = useMemo(() => seedFromPrefs(basePrefs as UserPreferences), []);
  const savedNotes = ((basePrefs as any).file ?? {}) as FileNotes;

  const [phase, setPhase] = useState<'cover' | 'details' | 'prefs'>('cover');

  // Personal details — free-text blanks, seeded from onboarding the first time.
  const [family, setFamily] = useState(savedNotes.family ?? seed.family ?? '');
  const [pets, setPets] = useState(savedNotes.pets ?? seed.pets ?? '');
  const [job, setJob] = useState(savedNotes.job ?? seed.job ?? '');
  const [location, setLocation] = useState((basePrefs.city as string) ?? '');
  const [trustedName, setTrustedName] = useState(savedNotes.trustedName ?? '');
  const [trustedContact, setTrustedContact] = useState(savedNotes.trustedContact ?? '');
  const [hobbies, setHobbies] = useState((basePrefs.hobbies ?? []).join(', '));

  // Save is best-effort and must NEVER block navigation. We update the
  // in-session profile immediately (so edits persist and the other papers see
  // them), then try the remote save in the background — a slow or failed
  // network can't trap you on the page.
  const saveDetails = async () => {
    if (!user) return;
    const nextPrefs: any = {
      ...basePrefs,
      city: location.trim(),
      hobbies: hobbies.split(',').map((h) => h.trim()).filter(Boolean),
      file: { family, pets, job, trustedName, trustedContact },
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
        {phase === 'cover' && (
          <DrawnForm source={folderClosed} label="file-cover" onBack={() => router.back()}>
            <UsernameZone id="cover_name" rect={R.cover_name} fontSize={30} />
          </DrawnForm>
        )}

        {phase === 'details' && (
          <DrawnForm source={detailsPaper} label="file-details" onBack={() => { void saveDetails(); setPhase('cover'); }}>
            <UsernameZone id="d_username" rect={R.d_username} fontSize={20} />
            <FieldZone id="d_family" rect={R.d_family} value={family} onChangeText={setFamily} placeholder="Who's at home" />
            <FieldZone id="d_pets" rect={R.d_pets} value={pets} onChangeText={setPets} placeholder="Any pets?" />
            <FieldZone id="d_job" rect={R.d_job} value={job} onChangeText={setJob} placeholder="Work" />
            <FieldZone id="d_location" rect={R.d_location} value={location} onChangeText={setLocation} placeholder="City or area" />
            <FieldZone id="d_trustedName" rect={R.d_trustedName} value={trustedName} onChangeText={setTrustedName} placeholder="Their name" />
            <FieldZone id="d_trustedContact" rect={R.d_trustedContact} value={trustedContact} onChangeText={setTrustedContact} placeholder="Phone or email" />
            <FieldZone id="d_hobbies" rect={R.d_hobbies} value={hobbies} onChangeText={setHobbies} placeholder="The good stuff (comma separated)" multiline fontSize={16} />
          </DrawnForm>
        )}

        {phase === 'prefs' && (
          <DrawnForm source={prefsPaper} label="file-prefs" onBack={() => setPhase('details')}>
            <TickZone id="p_daily_checkin" rect={R.p_daily_checkin} value={notifOn('daily_checkin')} onToggle={() => toggleNotif('daily_checkin')} />
            <TickZone id="p_morning_reflection" rect={R.p_morning_reflection} value={notifOn('morning_reflection')} onToggle={() => toggleNotif('morning_reflection')} />
            <TickZone id="p_drinking_reminders" rect={R.p_drinking_reminders} value={notifOn('drinking_reminders')} onToggle={() => toggleNotif('drinking_reminders')} />
            <TickZone id="p_session_nudges" rect={R.p_session_nudges} value={notifOn('session_nudges')} onToggle={() => toggleNotif('session_nudges')} />
            <TickZone id="p_milestone_alerts" rect={R.p_milestone_alerts} value={notifOn('milestone_alerts')} onToggle={() => toggleNotif('milestone_alerts')} />
            <TickZone id="p_community_updates" rect={R.p_community_updates} value={notifOn('community_updates')} onToggle={() => toggleNotif('community_updates')} />

            <LinkZone id="p_emergency" rect={R.p_emergency} onPress={() => router.push('/profile/emergency-contacts')} />
            <LinkZone id="p_export" rect={R.p_export} onPress={handleExport} />
            <LinkZone id="p_privacy" rect={R.p_privacy} onPress={() => Linking.openURL('https://se-ak1011.github.io/Alchono/privacy.html')} />
          </DrawnForm>
        )}

        {/* Floating paper-to-paper navigation — top centre, clear of the pencil + back chevron. */}
        {phase === 'cover' && <NavPill label="Open file  ▸" onPress={() => setPhase('details')} />}
        {phase === 'details' && <NavPill label="Preferences  ▸" onPress={() => { void saveDetails(); setPhase('prefs'); }} />}
        {phase === 'prefs' && <NavPill label="◂  Details" onPress={() => setPhase('details')} />}
      </View>
    </KeyboardAvoidingView>
  );
}

/** A tappable privacy row — invisible over the drawn chevron line. */
function LinkZone({ id, rect, onPress }: { id: string; rect: Rect; onPress: () => void }) {
  return (
    <TickZone id={id} rect={rect} value={false} onToggle={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); }} />
  );
}

function NavPill({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      style={{
        position: 'absolute',
        top: 56,
        alignSelf: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 18,
        backgroundColor: 'rgba(51,42,36,0.82)',
      }}
    >
      <Text style={{ fontFamily: 'PatrickHand', fontSize: 16, color: '#f3ead6' }}>{label}</Text>
    </Pressable>
  );
}
