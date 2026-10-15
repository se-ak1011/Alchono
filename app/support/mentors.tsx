import React, { useMemo, useState } from 'react';
import {
  View, Text, Pressable, ScrollView, TextInput, Platform, ActivityIndicator, Alert, Modal,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '@/components/ui/Avatar';
import {
  useAvailableMentors, useMyMentorProfile, useSaveMentorProfile, useStopMentoring,
  useRequestMentor, useMyMentorRequests, useCancelMentorRequest,
} from '@/hooks/useMentors';
import { useConnections, useBlockUser, useReportUser } from '@/hooks/useMessages';
import { usePresences } from '@/hooks/usePresence';
import { PRESENCE, type PresenceStatus } from '@/lib/presence';
import { useAuthStore } from '@/store/authStore';
import { MENTOR_LEVELS } from '@/types';

const MONO = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }) as string;
const PLUM = '#A489DE';
const INK = '#ECE9F1';
const MUTED = '#817B91';
const PANEL = '#2b2635';
const ROLE_BLURB = 'Peer support from lived experience.';

const levelLabel = (v?: string | null) => MENTOR_LEVELS.find((l) => l.value === v)?.label ?? v ?? '';

type Mentor = {
  id: string; user_id: string; username: string; recovery_level: string;
  bio: string | null; offer: string | null; comfortable: string | null; around: string | null;
  is_rural: boolean; total_sessions: number;
};
type ReqStatus = 'pending' | 'accepted' | 'declined' | null;

// ───────────────────────────── Find a mentor ──────────────────────────────

function StatusDot({ status }: { status: PresenceStatus | null }) {
  return (
    <View style={{ position: 'absolute', right: -1, bottom: -1, width: 12, height: 12, borderRadius: 6, backgroundColor: status ? PRESENCE[status].dot : '#5c5668', borderWidth: 2, borderColor: '#201D28' }} />
  );
}

function MentorCard({ m, status, reqStatus, onOpen }: {
  m: Mentor; status: PresenceStatus | null; reqStatus: ReqStatus; onOpen: () => void;
}) {
  const tag =
    reqStatus === 'pending' ? { t: 'request sent', c: PLUM } :
    reqStatus === 'accepted' ? { t: 'connected', c: '#7FB08A' } :
    reqStatus === 'declined' ? { t: 'declined', c: MUTED } :
    { t: 'accepting requests', c: '#7FB08A' };
  return (
    <Pressable onPress={onOpen} className="rounded-2xl px-4 py-4 mb-3 active:opacity-80" style={{ backgroundColor: PANEL, borderWidth: 1, borderColor: 'rgba(164,137,222,0.22)' }}>
      <View className="flex-row items-start gap-3">
        <View>
          <Avatar username={m.username} size="md" />
          <StatusDot status={status} />
        </View>
        <View className="flex-1">
          <View className="flex-row items-center gap-2 flex-wrap">
            <Text style={{ color: INK, fontSize: 15, fontWeight: '700' }} numberOfLines={1}>{m.username}</Text>
            <Text style={{ fontFamily: MONO, fontSize: 10, color: MUTED }}>mentor</Text>
            <Text style={{ fontFamily: MONO, fontSize: 10, color: PLUM }}>{levelLabel(m.recovery_level)}</Text>
            {m.is_rural ? <Text style={{ fontFamily: MONO, fontSize: 10, color: MUTED }}>rural</Text> : null}
          </View>
          <Text style={{ fontFamily: MONO, fontSize: 10.5, color: tag.c, marginTop: 2 }}>● {tag.t}</Text>
          {m.bio ? <Text style={{ color: '#B2ACC0', fontSize: 13.5, lineHeight: 19, marginTop: 6 }} numberOfLines={2}>{m.bio}</Text> : null}
          {m.offer ? <Text style={{ color: MUTED, fontSize: 12.5, lineHeight: 18, marginTop: 4 }} numberOfLines={1}>offers: {m.offer}</Text> : null}
        </View>
        <Text style={{ color: MUTED, fontSize: 18 }}>›</Text>
      </View>
    </Pressable>
  );
}

function MentorSheet({ m, status, reqStatus, reqId, onClose }: {
  m: Mentor; status: PresenceStatus | null; reqStatus: ReqStatus; reqId: string | null; onClose: () => void;
}) {
  const router = useRouter();
  const { mutate: request, isPending: requesting } = useRequestMentor();
  const { mutate: cancel, isPending: cancelling } = useCancelMentorRequest();
  const { mutate: block } = useBlockUser();
  const { mutate: report } = useReportUser();
  const { data: connections } = useConnections();

  const openChat = () => {
    const conn = (connections ?? []).find((c) => c.otherUserId === m.user_id);
    if (!conn) { Alert.alert('Not connected yet', 'Give them a moment to accept.'); return; }
    onClose();
    router.push({ pathname: '/messages/[requestId]', params: { requestId: conn.requestId, type: 'mentor', username: m.username, otherUserId: m.user_id } } as any);
  };
  const sendRequest = () => {
    Alert.alert('Connect with this mentor?', 'Only your username is shared — no contact details. Either of you can end it any time.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Send request', onPress: () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); request({ mentorId: m.user_id }); } },
    ]);
  };
  const confirmBlockReport = () => {
    Alert.alert(m.username, undefined, [
      { text: 'Report', style: 'destructive', onPress: () => { report({ reportedUserId: m.user_id, reason: 'mentor_profile' }); Alert.alert('Reported', 'Thank you — our team will review.'); } },
      { text: 'Block', style: 'destructive', onPress: () => { block(m.user_id); Alert.alert('Blocked', 'You won’t see each other again.'); onClose(); } },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const Row = ({ label, value }: { label: string; value: string | null }) => value ? (
    <View style={{ marginTop: 14 }}>
      <Text style={{ fontFamily: MONO, fontSize: 10.5, color: PLUM, letterSpacing: 1, marginBottom: 4 }}>{label}</Text>
      <Text style={{ color: '#D9D4E4', fontSize: 14.5, lineHeight: 21 }}>{value}</Text>
    </View>
  ) : null;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(8,7,12,0.72)', justifyContent: 'flex-end' }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View style={{ backgroundColor: '#201D28', borderTopLeftRadius: 22, borderTopRightRadius: 22, borderWidth: 1, borderColor: 'rgba(164,137,222,0.25)', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 34, maxHeight: '86%' }}>
          <View style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(236,233,241,0.2)', marginBottom: 14 }} />
          <ScrollView showsVerticalScrollIndicator={false}>
            <View className="flex-row items-center gap-3">
              <View><Avatar username={m.username} size="lg" /><StatusDot status={status} /></View>
              <View className="flex-1">
                <Text style={{ color: INK, fontSize: 18, fontWeight: '700' }}>{m.username}</Text>
                <Text style={{ fontFamily: MONO, fontSize: 11, color: MUTED, marginTop: 2 }}>
                  mentor · {levelLabel(m.recovery_level)} · {status ? PRESENCE[status].short : 'offline'}
                </Text>
              </View>
            </View>
            <Text style={{ fontFamily: MONO, fontSize: 11, color: MUTED, marginTop: 10 }}>{ROLE_BLURB}</Text>

            <Row label="A bit about me" value={m.bio} />
            <Row label="What I can offer" value={m.offer} />
            <Row label="Comfortable talking about" value={m.comfortable} />
            <Row label="Usually around" value={m.around} />

            <View style={{ marginTop: 22, gap: 10 }}>
              {reqStatus === 'accepted' ? (
                <SheetButton label="Open chat in Messenger" primary onPress={openChat} />
              ) : reqStatus === 'pending' ? (
                <SheetButton label={cancelling ? 'Cancelling…' : 'Cancel request'} onPress={() => reqId && cancel(reqId, { onSuccess: onClose })} />
              ) : (
                <SheetButton label={requesting ? 'Sending…' : (reqStatus === 'declined' ? 'Ask again' : 'Connect')} primary disabled={requesting} onPress={sendRequest} />
              )}
              <SheetButton label="Rather talk to a professional? Find a counsellor →" onPress={() => { onClose(); router.push('/counsellors' as any); }} />
              <Pressable onPress={confirmBlockReport} hitSlop={8} style={{ alignItems: 'center', paddingVertical: 8 }}>
                <Text style={{ fontFamily: MONO, fontSize: 11, color: MUTED }}>block / report</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function SheetButton({ label, onPress, primary, disabled }: { label: string; onPress: () => void; primary?: boolean; disabled?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} className="active:opacity-80" style={{ paddingVertical: 13, borderRadius: 13, alignItems: 'center', backgroundColor: primary ? PLUM : 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: primary ? PLUM : 'rgba(236,233,241,0.12)', opacity: disabled ? 0.6 : 1 }}>
      <Text style={{ color: primary ? '#201D28' : '#C9C2D6', fontSize: 13.5, fontWeight: primary ? '800' : '600' }}>{label}</Text>
    </Pressable>
  );
}

function FindMentors({ onBecome }: { onBecome: () => void }) {
  const { data: mentors, isLoading, isError, refetch } = useAvailableMentors();
  const { data: myReqs } = useMyMentorRequests();
  const [open, setOpen] = useState<Mentor | null>(null);
  const ids = useMemo(() => (mentors ?? []).map((m: any) => m.user_id), [mentors]);
  const { data: presences } = usePresences(ids);

  if (isLoading) return <View style={{ paddingTop: 60, alignItems: 'center' }}><ActivityIndicator color={PLUM} /><Text style={{ fontFamily: MONO, fontSize: 12, color: MUTED, marginTop: 12 }}>finding mentors…</Text></View>;
  if (isError) return (
    <View style={{ paddingTop: 50, alignItems: 'center', paddingHorizontal: 30 }}>
      <Text style={{ fontFamily: MONO, fontSize: 12.5, color: MUTED, textAlign: 'center', lineHeight: 20 }}>// couldn’t load the directory{'\n'}check your connection and try again</Text>
      <SheetButton label="Retry" onPress={() => refetch()} />
    </View>
  );

  const list = (mentors ?? []) as unknown as Mentor[];
  const statusOf = (uid: string): PresenceStatus | null => presences?.[uid]?.status ?? null;
  const reqOf = (uid: string): { status: ReqStatus; id: string | null } => {
    const r = myReqs?.[uid];
    return { status: (r?.status as ReqStatus) ?? null, id: r?.id ?? null };
  };

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 6, paddingBottom: 36 }} showsVerticalScrollIndicator={false}>
      {list.length === 0 ? (
        <View style={{ paddingTop: 36, paddingHorizontal: 8 }}>
          <Text style={{ fontFamily: MONO, fontSize: 12.5, color: MUTED, textAlign: 'center', lineHeight: 20 }}>// no mentors around right now{'\n'}they come and go through the day — check back</Text>
          <Pressable onPress={onBecome} className="rounded-2xl px-5 py-4 mt-8 active:opacity-80" style={{ backgroundColor: PANEL, borderWidth: 1, borderColor: 'rgba(236,233,241,0.1)' }}>
            <Text style={{ color: INK, fontSize: 14.5, fontWeight: '600' }}>Been there yourself?</Text>
            <Text style={{ color: MUTED, fontSize: 12.5, marginTop: 2 }}>Become a mentor — the thing that helped you might help someone else.</Text>
          </Pressable>
        </View>
      ) : (
        list.map((m, i) => {
          const { status: rs, id: rid } = reqOf(m.user_id);
          return (
            <Animated.View key={m.id} entering={FadeInDown.duration(300).delay(Math.min(i * 40, 240))}>
              <MentorCard m={m} status={statusOf(m.user_id)} reqStatus={rs} onOpen={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setOpen(m); }} />
            </Animated.View>
          );
        })
      )}
      {open ? (() => { const { status: rs, id: rid } = reqOf(open.user_id); return (
        <MentorSheet m={open} status={statusOf(open.user_id)} reqStatus={rs} reqId={rid} onClose={() => setOpen(null)} />
      ); })() : null}
    </ScrollView>
  );
}

// ──────────────────────────── Become a mentor ─────────────────────────────

function Field({ label, value, onChangeText, placeholder, multiline }: {
  label: string; value: string; onChangeText: (t: string) => void; placeholder: string; multiline?: boolean;
}) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontFamily: MONO, fontSize: 10.5, color: PLUM, letterSpacing: 1, marginBottom: 6 }}>{label}</Text>
      <TextInput
        value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#5f5a70"
        multiline={multiline} selectionColor={PLUM}
        style={{ color: INK, fontSize: 14.5, lineHeight: 21, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(236,233,241,0.12)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, minHeight: multiline ? 70 : 44, textAlignVertical: multiline ? 'top' : 'center' }}
      />
    </View>
  );
}

function BecomeMentor() {
  const router = useRouter();
  const { data: existing } = useMyMentorProfile();
  const { mutate: save, isPending: saving } = useSaveMentorProfile();
  const { mutate: stop, isPending: stopping } = useStopMentoring();
  const username = useAuthStore((s) => s.profile?.username) ?? 'you';
  const defaultLevel = useAuthStore((s) => (s.profile as any)?.mentor_recovery_level) as string | undefined;

  const e = existing as any;
  const [level, setLevel] = useState<string>(e?.recovery_level ?? defaultLevel ?? '');
  const [bio, setBio] = useState(e?.bio ?? '');
  const [offer, setOffer] = useState(e?.offer ?? '');
  const [comfortable, setComfortable] = useState(e?.comfortable ?? '');
  const [around, setAround] = useState(e?.around ?? '');
  const [accepting, setAccepting] = useState<boolean>(e?.is_available ?? true);
  const [preview, setPreview] = useState(false);

  const isLive = !!existing;
  const canSave = !!level && bio.trim().length > 0;

  const doSave = () => {
    if (!canSave) { Alert.alert('Almost there', 'Pick how long you’ve got and write a line about yourself.'); return; }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    save({ recoveryLevel: level, bio, offer, comfortable, around, isAvailable: accepting }, {
      onSuccess: () => Alert.alert(isLive ? 'Saved' : 'You’re in the directory', isLive ? 'Your profile is updated.' : 'Members can now find and request you. You can pause or remove yourself any time.'),
    });
  };
  const remove = () => Alert.alert('Remove your mentor profile?', 'You’ll come out of the directory. Existing conversations stay.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Remove', style: 'destructive', onPress: () => stop(undefined, { onSuccess: () => router.back() }) },
  ]);

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 8, paddingBottom: 40 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <View style={{ backgroundColor: PANEL, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(164,137,222,0.25)', padding: 16, marginBottom: 16 }}>
        <Text style={{ fontFamily: MONO, fontSize: 12, color: INK }}>✎ edit your mentor profile</Text>
        <Text style={{ fontFamily: MONO, fontSize: 10.5, color: MUTED, marginTop: 4 }}>{ROLE_BLURB} Only your username is shown.</Text>
      </View>

      {preview ? (
        <>
          <Text style={{ fontFamily: MONO, fontSize: 10.5, color: PLUM, letterSpacing: 1, marginBottom: 8 }}>▚ preview — how members see you</Text>
          <MentorCard
            m={{ id: 'me', user_id: 'me', username, recovery_level: level, bio: bio.trim() || null, offer: offer.trim() || null, comfortable: comfortable.trim() || null, around: around.trim() || null, is_rural: false, total_sessions: e?.total_sessions ?? 0 }}
            status={'online'} reqStatus={null} onOpen={() => {}}
          />
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
            <View style={{ flex: 1 }}><SheetButton label="Keep editing" onPress={() => setPreview(false)} /></View>
            <View style={{ flex: 1 }}><SheetButton label={saving ? 'Saving…' : (isLive ? 'Save' : 'Make visible')} primary disabled={saving} onPress={doSave} /></View>
          </View>
        </>
      ) : (
        <>
          <Text style={{ fontFamily: MONO, fontSize: 10.5, color: PLUM, letterSpacing: 1, marginBottom: 6 }}>HOW LONG YOU’VE GOT</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            {MENTOR_LEVELS.map((l) => {
              const on = level === l.value;
              return (
                <Pressable key={l.value} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setLevel(l.value); }}
                  style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, backgroundColor: on ? 'rgba(164,137,222,0.18)' : 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: on ? PLUM : 'rgba(236,233,241,0.1)' }}>
                  <Text style={{ fontFamily: MONO, fontSize: 12, color: on ? INK : MUTED }}>{l.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <Field label="A BIT ABOUT ME" value={bio} onChangeText={setBio} placeholder="Who you are, where you’re at…" multiline />
          <Field label="WHAT I CAN OFFER" value={offer} onChangeText={setOffer} placeholder="A listening ear on hard nights, early-days tips…" multiline />
          <Field label="WHAT I’M COMFORTABLE TALKING ABOUT" value={comfortable} onChangeText={setComfortable} placeholder="Cravings, relationships, relapse — your call…" multiline />
          <Field label="WHEN I’M USUALLY AROUND" value={around} onChangeText={setAround} placeholder="Evenings after 8, most weekends…" />

          <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setAccepting((v) => !v); }}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(236,233,241,0.1)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, marginBottom: 18 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: INK, fontSize: 14, fontWeight: '600' }}>{accepting ? 'Accepting requests' : 'Taking a break'}</Text>
              <Text style={{ color: MUTED, fontSize: 12, marginTop: 2 }}>{accepting ? 'You’re visible in the directory.' : 'Hidden from the directory — existing chats stay.'}</Text>
            </View>
            <View style={{ width: 46, height: 26, borderRadius: 13, padding: 3, backgroundColor: accepting ? PLUM : '#474151', alignItems: accepting ? 'flex-end' : 'flex-start' }}>
              <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#ECE9F1' }} />
            </View>
          </Pressable>

          <SheetButton label="Preview my profile" primary onPress={() => { if (!canSave) { Alert.alert('Almost there', 'Pick how long you’ve got and write a line about yourself.'); return; } setPreview(true); }} />
          {isLive ? (
            <Pressable onPress={remove} hitSlop={8} disabled={stopping} style={{ alignItems: 'center', paddingVertical: 14, marginTop: 4 }}>
              <Text style={{ fontFamily: MONO, fontSize: 11.5, color: '#C98282' }}>{stopping ? 'removing…' : 'remove me from the directory'}</Text>
            </Pressable>
          ) : null}
        </>
      )}
    </ScrollView>
  );
}

// ─────────────────────────────── Screen ───────────────────────────────────

export default function MentorsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<'find' | 'become'>('find');

  return (
    <View style={{ flex: 1, backgroundColor: '#201D28', paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <View className="flex-row items-center gap-3 px-4 py-3" style={{ backgroundColor: PANEL, borderBottomWidth: 1, borderBottomColor: 'rgba(164,137,222,0.25)' }}>
        <Pressable onPress={() => router.back()} hitSlop={12} className="active:opacity-60">
          <Text style={{ color: '#B2ACC0', fontSize: 18 }}>‹</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: MONO, fontSize: 14, color: INK, letterSpacing: 1 }}>Mentors</Text>
          <Text style={{ fontFamily: MONO, fontSize: 10.5, color: MUTED, marginTop: 1 }}>{ROLE_BLURB}</Text>
        </View>
        <Pressable onPress={() => router.push('/messages' as any)} hitSlop={8} className="rounded-full px-3 py-1.5 active:opacity-70" style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(236,233,241,0.14)' }}>
          <Text style={{ fontFamily: MONO, fontSize: 11, color: '#C6B2F0' }}>messages</Text>
        </Pressable>
      </View>

      <View className="mx-6 mt-3 mb-3 flex-row" style={{ gap: 8 }}>
        {(['find', 'become'] as const).map((t) => {
          const on = tab === t;
          return (
            <Pressable key={t} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setTab(t); }}
              style={{ flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 11, backgroundColor: on ? 'rgba(164,137,222,0.16)' : 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: on ? 'rgba(164,137,222,0.5)' : 'rgba(236,233,241,0.08)' }}>
              <Text style={{ fontFamily: MONO, fontSize: 12.5, letterSpacing: 1, color: on ? INK : MUTED }}>
                {t === 'find' ? '◍ FIND A MENTOR' : '✎ BECOME ONE'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={{ flex: 1 }}>
        {tab === 'find' ? <FindMentors onBecome={() => setTab('become')} /> : <BecomeMentor />}
      </View>
    </View>
  );
}
