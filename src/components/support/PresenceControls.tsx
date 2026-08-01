import React, { useState } from 'react';
import { View, Text, Pressable, Modal, TextInput, Platform, KeyboardAvoidingView, Switch } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { PRESENCE, PRESENCE_ORDER, type PresenceStatus } from '@/lib/presence';
import { useMyStatus, useSetStatus, useAcceptsMessages, useSetAcceptsMessages } from '@/hooks/usePresence';

const MONO = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }) as string;

/** A small dot + status label for any status value. */
export function StatusDot({ status, size = 8 }: { status: PresenceStatus; size?: number }) {
  return <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: PRESENCE[status].dot }} />;
}

/**
 * The member's own status control, MSN-style: a little pill showing your
 * chosen dot + label (and status message), tapping it opens a picker to
 * switch and to set a status line. It's the nostalgic centrepiece of the room.
 */
export function MyStatusPill() {
  const { status, statusMessage } = useMyStatus();
  const { mutate: setStatus, isPending } = useSetStatus();
  const acceptsMessages = useAcceptsMessages();
  const { mutate: setAccepts, isPending: savingAccepts } = useSetAcceptsMessages();
  const [open, setOpen] = useState(false);
  const [draftMsg, setDraftMsg] = useState(statusMessage ?? '');

  const openPicker = () => {
    setDraftMsg(statusMessage ?? '');
    setOpen(true);
  };

  const choose = (s: PresenceStatus) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStatus({ status: s });
  };

  const saveMessage = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStatus({ status, statusMessage: draftMsg });
    setOpen(false);
  };

  return (
    <>
      <Pressable
        onPress={openPicker}
        hitSlop={6}
        className="flex-row items-center active:opacity-70"
        style={{
          alignSelf: 'flex-start',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 7,
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 20,
          backgroundColor: 'rgba(255,255,255,0.05)',
          borderWidth: 1,
          borderColor: 'rgba(236,233,241,0.14)',
        }}
      >
        <StatusDot status={status} />
        <Text style={{ fontFamily: MONO, fontSize: 12.5, color: '#ECE9F1' }}>you · {PRESENCE[status].label}</Text>
        <Text style={{ fontFamily: MONO, fontSize: 12, color: '#817B91' }}>▾</Text>
      </Pressable>
      {statusMessage ? (
        <Text style={{ color: '#9089a0', fontSize: 12.5, fontStyle: 'italic', marginTop: 4, marginLeft: 4 }} numberOfLines={1}>
          “{statusMessage}”
        </Text>
      ) : null}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable style={{ flex: 1, backgroundColor: 'rgba(8,6,11,0.6)' }} onPress={() => setOpen(false)} />
          <Animated.View
            entering={FadeInDown.duration(200)}
            style={{
              backgroundColor: '#2b2635',
              borderTopLeftRadius: 22,
              borderTopRightRadius: 22,
              borderWidth: 1,
              borderColor: 'rgba(236,233,241,0.1)',
              paddingHorizontal: 20,
              paddingTop: 16,
              paddingBottom: 34,
            }}
          >
          <View style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(236,233,241,0.18)', marginBottom: 16 }} />
          <Text style={{ fontFamily: MONO, fontSize: 12, color: '#817B91', letterSpacing: 1, marginBottom: 12 }}>set your status</Text>

          {PRESENCE_ORDER.map((s) => {
            const on = s === status;
            return (
              <Pressable
                key={s}
                onPress={() => choose(s)}
                disabled={isPending}
                className="flex-row items-center active:opacity-70"
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 11,
                  paddingVertical: 12,
                  paddingHorizontal: 12,
                  borderRadius: 12,
                  marginBottom: 6,
                  backgroundColor: on ? 'rgba(164,137,222,0.16)' : 'transparent',
                  borderWidth: 1,
                  borderColor: on ? 'rgba(164,137,222,0.45)' : 'transparent',
                }}
              >
                <StatusDot status={s} size={11} />
                <Text style={{ color: '#ECE9F1', fontSize: 16, flex: 1 }}>{PRESENCE[s].label}</Text>
                {on ? <Text style={{ color: '#A489DE', fontSize: 15 }}>✓</Text> : null}
              </Pressable>
            );
          })}

          <Text style={{ fontFamily: MONO, fontSize: 12, color: '#817B91', letterSpacing: 1, marginTop: 14, marginBottom: 8 }}>status message</Text>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
            <TextInput
              value={draftMsg}
              onChangeText={setDraftMsg}
              placeholder="brb, making tea ☕"
              placeholderTextColor="#817B91"
              maxLength={80}
              className="flex-1 rounded-xl px-3.5 py-3 text-text-primary text-base"
              style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(236,233,241,0.12)' }}
              selectionColor="#B2ACC0"
            />
            <Pressable
              onPress={saveMessage}
              disabled={isPending}
              style={{ borderRadius: 11, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#A489DE' }}
            >
              <Text style={{ fontFamily: MONO, fontSize: 13, fontWeight: '700', color: '#201D28', letterSpacing: 1 }}>SAVE</Text>
            </Pressable>
          </View>
          {draftMsg.length > 0 ? (
            <Pressable onPress={() => setDraftMsg('')} hitSlop={8} className="self-start mt-2 active:opacity-60">
              <Text style={{ fontFamily: MONO, fontSize: 11.5, color: '#817B91' }}>clear message</Text>
            </Pressable>
          ) : null}

          {/* Reachability — separate from showing your name. Brave out loud
              (username visible) can still mean "don't message me". */}
          <View style={{ height: 1, backgroundColor: 'rgba(236,233,241,0.1)', marginTop: 18, marginBottom: 14 }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#ECE9F1', fontSize: 15 }}>Accept message requests</Text>
              <Text style={{ color: '#817B91', fontSize: 12.5, lineHeight: 17, marginTop: 3 }}>
                Off: your posts can still show your name, but no one can message you. Even on, you accept or deny each request.
              </Text>
            </View>
            <Switch
              value={acceptsMessages}
              onValueChange={(v) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setAccepts(v);
              }}
              disabled={savingAccepts}
              trackColor={{ true: '#A489DE', false: '#474151' }}
              thumbColor="#ECE9F1"
              ios_backgroundColor="#474151"
            />
          </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}
