import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
  Linking,
  type LayoutChangeEvent,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  FadeIn,
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { useStartSession } from '@/hooks/useDrinkingSession';
import { useLogUrgeOutcome, useUrgeStats, useTypicalUrgeMinutes } from '@/hooks/useVictories';
import { useAuthStore } from '@/store/authStore';
import { useHubStore } from '@/store/hubStore';
import { headingShadow, celebrationGlow } from '@/styles';
import { useAiCoach } from '@/hooks/useAiCoach';
import type { ChatMessage, UserPreferences } from '@/types';

/**
 * The urge flow — redrawn as a place. However you got here (any "I need a
 * drink" button), the flow takes you OUT: out of whatever room you were in and
 * onto a covered porch at night, looking into a quiet garden. Stepping away is
 * the oldest urge advice there is, so the flow IS the intervention — you don't
 * read "change your space", you change it.
 *
 * Everything is a thing in the scene:
 *   · the skull-flowers  → Grounding (outward first; breath is one optional card)
 *   · the phone          → your own people (message/check-in nudges)
 *   · the handheld       → the arcade
 *   · the left path      → the café courtyard (the existing `outside` hub scene)
 *   · the right path     → the "grounds" — other recovery worlds, not open yet
 *   · the armchair/dock  → the AI coach, right there with you
 * Top chrome: Back, "It passed" (the win), and the crisis-lines escape hatch.
 *
 * Scene-object hotspot boxes are fractional (0..1) over the art, placed from the
 * annotated mock and easy to nudge from in-build feedback. Positioning mirrors
 * the hub's cover-fit geometry so the pills land right on every screen.
 */

const SCENE = require('../../assets/scenes/urge_outside.webp');
const IMG_W = 851;
const IMG_H = 1847;

const BREATH_MS = 4000;
const TOTAL_HALF_CYCLES = 4; // two full breaths — short on purpose; skippable anytime

type Overlay = null | 'grounding' | 'breath' | 'people' | 'drink';

type SpotId = 'grounding' | 'people' | 'game' | 'grounds';
const SPOTS: Record<SpotId, { label: string; x: number; y: number; w: number; h: number }> = {
  grounding: { label: 'Grounding', x: 0.17, y: 0.43, w: 0.26, h: 0.12 },
  people: { label: 'Talk to a person', x: 0.0, y: 0.55, w: 0.3, h: 0.12 },
  game: { label: 'Play a game', x: 0.22, y: 0.585, w: 0.28, h: 0.1 },
  grounds: { label: 'Future grounds', x: 0.8, y: 0.3, w: 0.2, h: 0.22 },
};

type GroundingCard = { id: string; title: string; body: string };

function groundingCards(prefs: UserPreferences | null): GroundingCard[] {
  const petName = prefs?.hasPets ? prefs.petName?.trim() : null;
  const heavy = petName
    ? `Pick up something with real weight — ${petName}, a full kettle, a heavy book. Let your arms feel it.`
    : 'Pick up something with real weight — a full kettle, a heavy book. Let your arms feel it.';
  return [
    { id: 'cold', title: 'Cold water', body: 'Run your wrists under the cold tap. Splash your face. Hold something from the freezer.' },
    { id: 'feet', title: 'Feet on the floor', body: 'Press both feet down, hard. Feel the ground take your weight.' },
    { id: 'heavy', title: 'Something heavy', body: heavy },
    { id: 'five', title: 'Five things', body: 'Name five things you can see. Four you can hear. Three you can touch.' },
    { id: 'move', title: 'Move', body: 'Stand up. Walk to another room and back. Movement shifts the state.' },
  ];
}

type PersonAction = { id: string; label: string; sub: string; contact?: string };

function peopleActions(prefs: UserPreferences | null): PersonAction[] {
  const list: PersonAction[] = [];
  // Your private "who to call" from the Personal File — the one real, tappable
  // contact, surfaced first. Tapping it dials/emails them.
  const file = (prefs as any)?.file as { trustedName?: string; trustedContact?: string } | undefined;
  const trustedName = file?.trustedName?.trim();
  const trustedContact = file?.trustedContact?.trim();
  if (trustedContact) {
    list.push({
      id: 'trusted',
      label: trustedName ? `Call ${trustedName}` : 'Call your person',
      sub: 'The one you wrote in your file. Let them know where you’re at.',
      contact: trustedContact,
    });
  }
  if (prefs?.familyMembers?.includes('partner')) {
    const name = prefs.partnerName?.trim();
    list.push({ id: 'partner', label: name ? `Message ${name}` : 'Message your partner', sub: 'One honest line. Just tell them where you’re at.' });
  }
  if (prefs?.familyMembers?.includes('children')) {
    const names = prefs.childrenNames?.trim();
    const count = prefs.childrenCount ?? 1;
    list.push({ id: 'kids', label: `Check on ${names || (count === 1 ? 'your little one' : 'your kids')}`, sub: 'Go into the room. Be with them for a minute.' });
  }
  if (prefs?.hasPets) {
    const count = prefs.petCount ?? 1;
    const name = prefs.petName?.trim() || (count === 1 ? 'your dog' : 'your pets');
    list.push({ id: 'pet', label: `Take ${name} out`, sub: 'Fresh air, both of you. Shift the moment.' });
  }
  list.push({ id: 'anyone', label: 'Text one person who gets it', sub: 'They don’t need the whole story — just “today’s hard.”' });
  return list;
}

function buildReasonNames(prefs: UserPreferences | null): string | null {
  if (!prefs) return null;
  const parts: string[] = [];
  if (prefs.familyMembers?.includes('partner') && prefs.partnerName?.trim()) parts.push(prefs.partnerName.trim());
  if (prefs.familyMembers?.includes('children') && prefs.childrenNames?.trim()) parts.push(prefs.childrenNames.trim());
  return parts.length > 0 ? parts.join(' & ') : null;
}

export default function UrgeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useAuthStore();
  const { mutate: startSession } = useStartSession();
  const { mutate: logUrge } = useLogUrgeOutcome();
  const { data: urgeStats } = useUrgeStats();
  const { data: typicalMinutes } = useTypicalUrgeMinutes();
  const urgeStartRef = useRef(Date.now());
  const prefs = (profile as any)?.preferences as UserPreferences | null;

  const [passed, setPassed] = useState(false);
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [survivedCount, setSurvivedCount] = useState(0);
  const [input, setInput] = useState('');
  const [box, setBox] = useState({ w: 0, h: 0 });

  const { messages, isTyping, sendMessage } = useAiCoach('urge', 'I’m here.\n\nWhat would help right now?');

  // Breath circle — only used inside the (optional) breath card.
  const [halfCycle, setHalfCycle] = useState(0);
  const circleScale = useSharedValue(0.6);
  const circleOpacity = useSharedValue(0.35);
  const circleStyle = useAnimatedStyle(() => ({ transform: [{ scale: circleScale.value }], opacity: circleOpacity.value }));
  const isIn = halfCycle % 2 === 0;
  const breathsLeft = Math.ceil((TOTAL_HALF_CYCLES - halfCycle) / 2);

  useEffect(() => {
    if (overlay !== 'breath') return;
    if (halfCycle >= TOTAL_HALF_CYCLES) { setOverlay('grounding'); return; }
    Haptics.impactAsync(isIn ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light);
    circleScale.value = withTiming(isIn ? 1.4 : 0.6, { duration: BREATH_MS });
    circleOpacity.value = withTiming(isIn ? 0.75 : 0.35, { duration: BREATH_MS });
    const t = setTimeout(() => setHalfCycle((h) => h + 1), BREATH_MS);
    return () => clearTimeout(t);
  }, [overlay, halfCycle]);

  // The "grounds" path glows faintly — alive, but not open yet.
  const groundsPulse = useSharedValue(0.25);
  useEffect(() => {
    groundsPulse.value = withRepeat(withSequence(withTiming(0.6, { duration: 1800 }), withTiming(0.22, { duration: 1800 })), -1, false);
  }, []);
  const groundsStyle = useAnimatedStyle(() => ({ opacity: groundsPulse.value }));

  // Cover-fit geometry so fractional hotspots land on the real objects.
  const scale = box.w > 0 ? Math.max(box.w / IMG_W, box.h / IMG_H) : 1;
  const dispW = IMG_W * scale;
  const dispH = IMG_H * scale;
  const offX = (box.w - dispW) / 2;
  const offY = (box.h - dispH) / 2;
  const place = (s: { x: number; y: number; w: number; h: number }) => ({
    position: 'absolute' as const,
    left: offX + s.x * dispW,
    top: offY + s.y * dispH,
    width: s.w * dispW,
    height: s.h * dispH,
  });
  const onLayout = (e: LayoutChangeEvent) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height });

  const reasonNames = buildReasonNames(prefs);

  const goCourtyard = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    useHubStore.getState().setPendingNode('outside');
    router.replace('/(tabs)');
  };

  const goGrounds = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    useHubStore.getState().setPendingNode('reception');
    router.replace('/(tabs)');
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isTyping) return;
    setInput('');
    await sendMessage(text);
  };

  const handleUrgePassed = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSurvivedCount((urgeStats?.allTimePassed ?? 0) + 1);
    logUrge({ outcome: 'passed', durationSeconds: (Date.now() - urgeStartRef.current) / 1000 });
    setOverlay(null);
    setPassed(true);
  };

  const handleDrinkAnyway = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    logUrge({ outcome: 'drank', durationSeconds: (Date.now() - urgeStartRef.current) / 1000 });
    startSession();
    router.back();
  };

  const startBreath = () => { setHalfCycle(0); circleScale.value = 0.6; circleOpacity.value = 0.35; setOverlay('breath'); };

  // ---- The win screen takes over everything. --------------------------------
  if (passed) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0d0b12' }}>
        <Image source={SCENE} style={{ position: 'absolute', left: offX, top: offY, width: dispW, height: dispH, opacity: 0.5 }} onLayout={onLayout} />
        <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(13,11,18,0.62)' }} />
        <Animated.View entering={FadeIn.duration(500)} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
          <Text className="text-text-muted text-sm font-semibold tracking-widest uppercase mb-4">Logged</Text>
          <Text className="text-text-primary text-4xl font-semibold tracking-tight mb-4" style={celebrationGlow}>It passed.</Text>
          <Text className="text-text-secondary text-lg text-center leading-relaxed mb-12">
            {survivedCount <= 1 ? 'You got through your first one.' : `That’s ${survivedCount} times you’ve got through it.`}
            {'\n'}Proof this works.
          </Text>
          <Button title="Done" variant="primary" size="lg" fullWidth onPress={() => router.back()} />
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0d0b12' }} onLayout={onLayout}>
      <Image source={SCENE} style={{ position: 'absolute', left: offX, top: offY, width: dispW, height: dispH }} />

      {/* ---- Scene-object hotspots (hidden while an overlay is open) -------- */}
      {box.w > 0 && !overlay && (
        <>
          {/* Grounding — the skull-flowers */}
          <Pressable style={place(SPOTS.grounding)} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setOverlay('grounding'); }}>
            <ScenePill label="Grounding" />
          </Pressable>

          {/* Talk to a person — the phone */}
          <Pressable style={place(SPOTS.people)} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setOverlay('people'); }}>
            <ScenePill label="Talk to a person" />
          </Pressable>

          {/* Play a game — the handheld */}
          <Pressable style={place(SPOTS.game)} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.navigate('/session/games?from=urge' as any); }}>
            <ScenePill label="Play a game" />
          </Pressable>

          {/* The grounds — the right path out to the shared reception. */}
          <Pressable style={place(SPOTS.grounds)} onPress={goGrounds}>
            <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: '28%', top: '34%', width: '44%', height: '32%', borderRadius: 999, backgroundColor: '#A489DE' }, groundsStyle]} />
            <View style={{ position: 'absolute', left: 0, right: 0, bottom: 2, alignItems: 'center' }}>
              <View style={{ backgroundColor: 'rgba(13,11,18,0.72)', borderRadius: 14, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(236,233,241,0.14)' }}>
                <Text style={{ color: '#CFC7DE', fontSize: 11, textAlign: 'center' }} numberOfLines={2}>The grounds</Text>
              </View>
            </View>
          </Pressable>
        </>
      )}

      {/* ---- Top chrome ---------------------------------------------------- */}
      <View pointerEvents="box-none" style={{ position: 'absolute', top: insets.top + 8, left: 0, right: 0 }}>
        <View className="flex-row items-start justify-between px-4">
          <ChromePill onPress={() => router.back()}>
            <Feather name="chevron-left" size={16} color="#ECE9F1" />
            <Text style={{ color: '#ECE9F1', fontSize: 15, fontWeight: '600' }}>Back</Text>
          </ChromePill>
          <ChromePill onPress={handleUrgePassed}>
            <Feather name="flag" size={14} color="#ECE9F1" />
            <Text style={{ color: '#ECE9F1', fontSize: 15, fontWeight: '600' }}>It passed</Text>
          </ChromePill>
        </View>
        <View className="items-center mt-2 px-4">
          <ChromePill onPress={() => router.navigate('/resources/home' as any)}>
            <Feather name="life-buoy" size={14} color="#F0C987" />
            <Text style={{ color: '#F3EEDB', fontSize: 14, fontWeight: '600' }}>Need a person? · Help &amp; crisis lines</Text>
          </ChromePill>
        </View>
      </View>

      {/* ---- Left nav: the courtyard --------------------------------------- */}
      {!overlay && (
        <View pointerEvents="box-none" style={{ position: 'absolute', left: 8, top: insets.top + 96 }}>
          <ChromePill onPress={goCourtyard}>
            <Feather name="chevron-left" size={16} color="#ECE9F1" />
            <Text style={{ color: '#ECE9F1', fontSize: 14, fontWeight: '600' }}>Café courtyard</Text>
          </ChromePill>
        </View>
      )}

      {/* ---- Docked AI coach (bottom) ------------------------------------- */}
      {!overlay && (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}>
          <View style={{ margin: 12, marginBottom: insets.bottom + 10, borderRadius: 24, backgroundColor: 'rgba(16,13,22,0.9)', borderWidth: 1, borderColor: 'rgba(236,233,241,0.12)', padding: 14, shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 16, shadowOffset: { width: 0, height: 8 } }}>
            <View className="flex-row items-center gap-2 mb-2">
              <Feather name="message-circle" size={15} color="#A489DE" />
              <Text style={{ color: '#CFC7DE', fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' }}>AI coach</Text>
            </View>
            {messages.length > 0 && (
              <ScrollView style={{ maxHeight: 168 }} contentContainerStyle={{ paddingBottom: 4 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                {messages.map((m) => <ChatBubble key={m.id} message={m} />)}
                {isTyping ? <Text className="text-text-secondary text-lg px-2 py-1">···</Text> : null}
              </ScrollView>
            )}
            <View className="flex-row items-end gap-3 pt-1">
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder="Type if you want to…"
                placeholderTextColor="#817B91"
                multiline
                maxLength={500}
                onSubmitEditing={handleSend}
                returnKeyType="send"
                blurOnSubmit
                className="flex-1 rounded-2xl px-4 py-3 text-text-primary text-base max-h-24"
                style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
                selectionColor="#A489DE"
              />
              <Pressable onPress={handleSend} className="w-11 h-11 rounded-full items-center justify-center" style={{ backgroundColor: input.trim() && !isTyping ? '#A489DE' : 'rgba(255,255,255,0.08)' }}>
                <Feather name="arrow-up" size={18} color={input.trim() && !isTyping ? '#1a1622' : '#817B91'} />
              </Pressable>
            </View>
            {typicalMinutes && messages.length === 0 ? (
              <Text className="text-text-muted text-xs leading-relaxed mt-2">These usually pass in ~{typicalMinutes} minute{typicalMinutes === 1 ? '' : 's'}. Pick something above, talk, or just sit out here a while.</Text>
            ) : null}
            <Pressable onPress={() => setOverlay('drink')} hitSlop={8} className="self-center mt-3">
              <Text className="text-text-muted text-xs">I’m going to drink anyway →</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      )}

      {/* ===== Overlays ==================================================== */}

      {overlay === 'grounding' && (
        <OverlaySheet title="Grounding" subtitle="Get out of your head and into your body. Pick one." onClose={() => setOverlay(null)} insets={insets}>
          {groundingCards(prefs).map((c) => (
            <View key={c.id} className="rounded-2xl px-5 py-4 mb-3" style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(236,233,241,0.1)' }}>
              <Text className="text-text-primary text-lg font-semibold mb-1" style={headingShadow}>{c.title}</Text>
              <Text className="text-text-secondary text-base leading-relaxed">{c.body}</Text>
            </View>
          ))}
          {/* Breath is one option among many — never the headline. */}
          <Pressable onPress={startBreath} className="rounded-2xl px-5 py-4 mb-1" style={{ backgroundColor: 'rgba(164,137,222,0.08)', borderWidth: 1, borderColor: 'rgba(164,137,222,0.28)' }}>
            <View className="flex-row items-center justify-between">
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text className="text-text-primary text-lg font-semibold mb-1">Breathing <Text className="text-text-muted text-sm font-normal">· optional</Text></Text>
                <Text className="text-text-secondary text-base leading-relaxed">A slow rhythm, if it helps you. If breathwork winds you up instead, skip it — one of the above will do more.</Text>
              </View>
              <Feather name="chevron-right" size={18} color="#A489DE" />
            </View>
          </Pressable>
        </OverlaySheet>
      )}

      {overlay === 'people' && (
        <OverlaySheet title="Talk to a person" subtitle="Reach one of your people. Put the phone down after and come back." onClose={() => setOverlay(null)} insets={insets}>
          {reasonNames && (
            <View className="mb-4">
              <Text className="text-text-muted text-xs font-semibold tracking-widest uppercase mb-1">Who you’re protecting</Text>
              <Text className="text-text-primary text-xl font-semibold">{reasonNames}.</Text>
            </View>
          )}
          {peopleActions(prefs).map((p) => {
            if (p.contact) {
              // The real, tappable contact from the File — dial or email them.
              const open = () => {
                const c = p.contact!.trim();
                const url = c.includes('@') ? `mailto:${c}` : `tel:${c.replace(/[^+\d]/g, '')}`;
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                Linking.openURL(url).catch(() => {});
              };
              return (
                <Pressable key={p.id} onPress={open} className="rounded-2xl px-5 py-4 mb-3" style={{ backgroundColor: 'rgba(164,137,222,0.12)', borderWidth: 1, borderColor: 'rgba(164,137,222,0.4)' }}>
                  <Text className="text-text-primary text-lg font-semibold mb-1" style={headingShadow}>{p.label}</Text>
                  <Text className="text-text-secondary text-base leading-relaxed">{p.sub}</Text>
                </Pressable>
              );
            }
            return (
              <View key={p.id} className="rounded-2xl px-5 py-4 mb-3" style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(236,233,241,0.1)' }}>
                <Text className="text-text-primary text-lg font-semibold mb-1" style={headingShadow}>{p.label}</Text>
                <Text className="text-text-secondary text-base leading-relaxed">{p.sub}</Text>
              </View>
            );
          })}
        </OverlaySheet>
      )}

      {overlay === 'breath' && (
        <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(13,11,18,0.94)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
          <Animated.View entering={FadeIn.duration(300)} style={{ alignItems: 'center' }}>
            <Text className="text-text-muted text-sm font-semibold tracking-widest uppercase mb-12">Breathing</Text>
            <View style={{ width: 260, height: 260, alignItems: 'center', justifyContent: 'center', marginBottom: 44 }}>
              <Animated.View style={[{ width: 190, height: 190, borderRadius: 95, backgroundColor: '#A489DE', position: 'absolute' }, circleStyle]} />
            </View>
            <Text className="text-text-primary text-3xl font-semibold mb-2" style={headingShadow}>{isIn ? 'In…' : 'Out…'}</Text>
            <Text className="text-text-muted text-base mb-10">{breathsLeft} {breathsLeft === 1 ? 'breath' : 'breaths'} left</Text>
            <Pressable onPress={() => setOverlay('grounding')} hitSlop={12} className="px-5 py-2.5 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(236,233,241,0.14)' }}>
              <Text className="text-text-secondary text-base font-medium">That’s enough — back to grounding</Text>
            </Pressable>
          </Animated.View>
        </View>
      )}

      {overlay === 'drink' && (
        <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(13,11,18,0.92)', justifyContent: 'center', paddingHorizontal: 28 }}>
          <Animated.View entering={FadeInUp.duration(300)}>
            <Text className="text-text-primary text-2xl font-semibold mb-2" style={headingShadow}>Honest answer.</Text>
            <Text className="text-text-secondary text-base leading-relaxed mb-8">No shame either way — logging it is how we learn your pattern. You can still change your mind.</Text>
            <Pressable onPress={handleDrinkAnyway} className="rounded-2xl px-5 py-5 mb-3" style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(236,233,241,0.12)' }}>
              <Text className="text-text-primary text-lg font-semibold mb-1">Yes — log it and start the session</Text>
              <Text className="text-text-muted text-base">We’ll be right here.</Text>
            </Pressable>
            <Pressable onPress={() => setOverlay(null)} className="rounded-2xl px-5 py-5" style={{ backgroundColor: 'rgba(164,137,222,0.1)', borderWidth: 1, borderColor: 'rgba(164,137,222,0.3)' }}>
              <Text className="text-text-primary text-lg font-semibold mb-1">Not yet — give it a few more minutes</Text>
              <Text className="text-text-muted text-base">Back to the porch.</Text>
            </Pressable>
          </Animated.View>
        </View>
      )}
    </View>
  );
}

function ScenePill({ label }: { label: string }) {
  return (
    <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ backgroundColor: 'rgba(13,11,18,0.72)', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1, borderColor: 'rgba(236,233,241,0.18)', shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } }}>
        <Text style={{ color: '#ECE9F1', fontSize: 14, fontWeight: '600', textAlign: 'center' }} numberOfLines={1}>{label}</Text>
      </View>
    </View>
  );
}

function ChromePill({ children, onPress }: { children: React.ReactNode; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      className="active:opacity-80"
      style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(13,11,18,0.78)', borderRadius: 22, paddingHorizontal: 14, paddingVertical: 9, borderWidth: 1, borderColor: 'rgba(236,233,241,0.16)' }}
    >
      {children}
    </Pressable>
  );
}

function OverlaySheet({
  title,
  subtitle,
  children,
  onClose,
  insets,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  onClose: () => void;
  insets: { top: number; bottom: number };
}) {
  return (
    <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(13,11,18,0.95)' }}>
      <View style={{ flex: 1, paddingTop: insets.top + 12, paddingHorizontal: 20, paddingBottom: insets.bottom + 12 }}>
        <View className="flex-row items-center justify-between mb-1">
          <Text className="text-text-primary text-2xl font-semibold tracking-tight" style={headingShadow}>{title}</Text>
          <Pressable onPress={onClose} hitSlop={12} className="w-9 h-9 rounded-full items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
            <Feather name="x" size={18} color="#ECE9F1" />
          </Pressable>
        </View>
        <Text className="text-text-secondary text-base leading-relaxed mb-5">{subtitle}</Text>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 12 }}>
          {children}
        </ScrollView>
      </View>
    </View>
  );
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  return (
    <Animated.View entering={FadeInDown.duration(300).springify()} className={`flex-row mb-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <View className={`max-w-[86%] px-4 py-3 rounded-2xl ${isUser ? 'rounded-tr-sm' : 'rounded-tl-sm'}`} style={{ backgroundColor: isUser ? '#A489DE' : 'rgba(255,255,255,0.07)' }}>
        <Text className="text-base leading-relaxed" style={{ color: isUser ? '#1a1622' : '#ECE9F1' }}>{message.content}</Text>
      </View>
    </Animated.View>
  );
}
