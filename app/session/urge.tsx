import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring, FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { SafeArea } from '@/components/ui/SafeArea';
import { Button } from '@/components/ui/Button';
import { CompanionArt } from '@/components/ui/CompanionArt';
import { useStartSession } from '@/hooks/useDrinkingSession';
import { useLogUrgeOutcome, useUrgeStats, useTypicalUrgeMinutes } from '@/hooks/useVictories';
import { useAuthStore } from '@/store/authStore';
import { headingShadow, celebrationGlow } from '@/styles';
import { useAiCoach } from '@/hooks/useAiCoach';
import { useCompanion } from '@/hooks/useCompanion';
import type { ChatMessage, UserPreferences } from '@/types';

const BREATH_MS = 4000;
const TOTAL_HALF_CYCLES = 6;

type Action = { id: string; label: string; subtitle: string; navigate?: string; mode?: 'breathing' | 'decision' };

function buildActions(prefs: UserPreferences | null): Action[] {
  const list: Action[] = [
    { id: 'breathing', label: 'Breathing', subtitle: 'A slow rhythm if your body wants one.', mode: 'breathing' },
    { id: 'game', label: 'Play a game', subtitle: 'Give your mind something else to do.', navigate: '/session/games?from=urge' },
    { id: 'reasons', label: 'Reasons', subtitle: 'Remember who and what you are protecting.', navigate: '/(tabs)/insights' },
    { id: 'journal', label: 'Journal', subtitle: 'Put the urge somewhere outside your body.', navigate: '/(tabs)/journal' },
    { id: 'grounding', label: 'Grounding', subtitle: 'Name what is real in the room right now.', navigate: '/toolkit/c/urge' },
  ];

  if (prefs?.familyMembers?.includes('partner')) {
    const name = prefs.partnerName?.trim();
    list.push({ id: 'partner', label: name ? `Message ${name}` : 'Message your partner', subtitle: 'They want to hear from you.', mode: 'decision' });
  }
  if (prefs?.familyMembers?.includes('children')) {
    const names = prefs.childrenNames?.trim();
    const count = prefs.childrenCount ?? 1;
    list.push({ id: 'kids', label: `Check in with ${names || (count === 1 ? 'your child' : 'your kids')}`, subtitle: 'Be present for a moment.', mode: 'decision' });
  }
  if (prefs?.hasPets) {
    const petCount = prefs.petCount ?? 1;
    const name = prefs.petName?.trim() || (petCount === 1 ? 'your pet' : 'your pets');
    list.push({ id: 'pet', label: `Take ${name} outside`, subtitle: 'Fresh air. Movement. Shift the state.', mode: 'decision' });
  }
  list.push(
    { id: 'good', label: 'Watch something good', subtitle: "Ninety seconds of the internet at its best.", navigate: '/session/good-feed' },
    { id: 'water', label: 'Drink a glass of water', subtitle: 'Just that. Nothing else.', mode: 'decision' },
    { id: 'walk', label: 'Step outside for 5 minutes', subtitle: 'Movement breaks the moment.', mode: 'decision' },
  );
  return list;
}

function buildReasonNames(prefs: UserPreferences | null): string | null {
  if (!prefs) return null;
  const parts: string[] = [];
  if (prefs.familyMembers?.includes('partner') && prefs.partnerName?.trim()) parts.push(prefs.partnerName.trim());
  if (prefs.familyMembers?.includes('children') && prefs.childrenNames?.trim()) parts.push(prefs.childrenNames.trim());
  return parts.length > 0 ? parts.join(' & ') : null;
}

function PressScale({ children, onPress, className, style }: { children: React.ReactNode; onPress?: () => void; className?: string; style?: any }) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={[animatedStyle, style]}>
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.975, { damping: 18, stiffness: 360 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 18, stiffness: 360 }); }}
        onPress={onPress}
        className={className}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

export default function UrgeScreen() {
  const router = useRouter();
  const { pose } = useCompanion();
  const { profile } = useAuthStore();
  const { mutate: startSession } = useStartSession();
  const { mutate: logUrge } = useLogUrgeOutcome();
  const { data: urgeStats } = useUrgeStats();
  const { data: typicalMinutes } = useTypicalUrgeMinutes();
  const urgeStartRef = useRef(Date.now());
  const prefs = (profile as any)?.preferences as UserPreferences | null;

  const [phase, setPhase] = useState<'choice' | 'breathing' | 'decision' | 'passed'>('choice');
  const [halfCycle, setHalfCycle] = useState(0);
  const [survivedCount, setSurvivedCount] = useState(0);
  const [input, setInput] = useState('');
  const { messages, isTyping, sendMessage } = useAiCoach('urge', "Hey.\n\nI’m here.\n\nWhat happened?");

  const circleScale = useSharedValue(0.6);
  const circleOpacity = useSharedValue(0.35);
  const circleStyle = useAnimatedStyle(() => ({ transform: [{ scale: circleScale.value }], opacity: circleOpacity.value }));
  const isIn = halfCycle % 2 === 0;

  useEffect(() => {
    if (phase !== 'breathing') return;
    if (halfCycle >= TOTAL_HALF_CYCLES) { setPhase('decision'); return; }
    Haptics.impactAsync(isIn ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light);
    circleScale.value = withTiming(isIn ? 1.4 : 0.6, { duration: BREATH_MS });
    circleOpacity.value = withTiming(isIn ? 0.75 : 0.35, { duration: BREATH_MS });
    const t = setTimeout(() => setHalfCycle((h) => h + 1), BREATH_MS);
    return () => clearTimeout(t);
  }, [phase, halfCycle]);

  const actions = buildActions(prefs);
  const reasonNames = buildReasonNames(prefs);
  const breathsLeft = Math.ceil((TOTAL_HALF_CYCLES - halfCycle) / 2);

  const doAction = (action: Action) => {
    if (action.mode === 'breathing') { setHalfCycle(0); setPhase('breathing'); return; }
    if (action.navigate) { router.navigate(action.navigate as any); return; }
    setPhase('decision');
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
    setPhase('passed');
  };

  const handleDrinkAnyway = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    logUrge({ outcome: 'drank', durationSeconds: (Date.now() - urgeStartRef.current) / 1000 });
    startSession();
    router.back();
  };

  return (
    <SafeArea bottom={false}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <View className="flex-row items-center justify-between px-6 pt-4 pb-2">
          <Pressable onPress={() => router.back()} hitSlop={12}><Text className="text-text-muted text-base">Close</Text></Pressable>
          {phase === 'choice' ? <Pressable onPress={() => setPhase('decision')} hitSlop={12}><Text className="text-text-muted text-base">It passed</Text></Pressable> : null}
        </View>

        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingBottom: 24 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {phase === 'choice' && (
            <Animated.View entering={FadeIn.duration(400)} style={{ flex: 1, paddingTop: 12 }}>
              <View className="items-center mb-4"><CompanionArt source={pose('elbows')} width={86} height={102} /></View>
              <Text className="text-text-muted text-sm font-semibold tracking-widest uppercase mb-3">Take action</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 24 }} className="-mx-1 px-1 mb-5">
                {actions.map((action) => (
                  <PressScale key={action.id} onPress={() => doAction(action)} className="bg-urge-surface rounded-3xl px-5 py-6 border border-white/12" style={{ width: 238, shadowColor: '#120D17', shadowOpacity: 0.85, shadowRadius: 14, shadowOffset: { width: 0, height: 7 } }}>
                    <Text className="text-text-primary text-2xl font-semibold leading-tight mb-2" style={headingShadow}>{action.label}</Text>
                    <Text className="text-text-secondary text-base leading-relaxed">{action.subtitle}</Text>
                  </PressScale>
                ))}
              </ScrollView>
              {typicalMinutes ? <Text className="text-text-muted text-sm leading-relaxed mb-5">These usually pass in ~{typicalMinutes} minute{typicalMinutes === 1 ? '' : 's'}. You can do something, talk, or both.</Text> : null}

              <Text className="text-text-muted text-sm font-semibold tracking-widest uppercase mb-3">Or talk</Text>
              <View className="bg-surface rounded-3xl border border-white/10 p-4" style={{ minHeight: 292, shadowColor: '#120D17', shadowOpacity: 0.72, shadowRadius: 14, shadowOffset: { width: 0, height: 7 } }}>
                <ScrollView style={{ maxHeight: 206 }} contentContainerStyle={{ paddingBottom: 4 }} keyboardShouldPersistTaps="handled">
                  {messages.map((message) => <ChatBubble key={message.id} message={message} />)}
                  {isTyping ? <Text className="text-text-secondary text-lg px-4 py-2">···</Text> : null}
                </ScrollView>
                <View className="flex-row items-end gap-3 pt-3 border-t border-white/5">
                  <TextInput value={input} onChangeText={setInput} placeholder="Type if you want to…" placeholderTextColor="#5E6472" multiline maxLength={500} onSubmitEditing={handleSend} returnKeyType="send" blurOnSubmit className="flex-1 bg-surface-2 rounded-2xl px-4 py-3 text-text-primary text-base max-h-24" selectionColor="#9CA3AF" />
                  <PressScale onPress={handleSend} className={`w-11 h-11 rounded-full items-center justify-center ${input.trim() && !isTyping ? 'bg-accent' : 'bg-surface-2'}`}><Text className="text-white text-lg">↑</Text></PressScale>
                </View>
              </View>
            </Animated.View>
          )}

          {phase === 'breathing' && (
            <Animated.View entering={FadeIn.duration(400)} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 520 }}>
              <Text className="text-text-muted text-sm font-semibold tracking-widest uppercase mb-12">Breathing</Text>
              <View style={{ width: 280, height: 280, alignItems: 'center', justifyContent: 'center', marginBottom: 48 }}><Animated.View style={[{ width: 200, height: 200, borderRadius: 100, backgroundColor: '#9CA3AF', position: 'absolute' }, circleStyle]} /></View>
              <Text className="text-text-primary text-3xl font-semibold mb-2" style={headingShadow}>{isIn ? 'Breathe in…' : 'Breathe out…'}</Text>
              <Text className="text-text-muted text-base mb-10">{breathsLeft} {breathsLeft === 1 ? 'breath' : 'breaths'} left</Text>
              <Pressable onPress={() => setPhase('choice')} hitSlop={12}><Text className="text-text-muted text-base">Back to choices</Text></Pressable>
            </Animated.View>
          )}

          {phase === 'decision' && (
            <Animated.View entering={FadeIn.duration(400)} style={{ paddingTop: 16 }}>
              <Text className="text-text-primary text-3xl font-semibold tracking-tight mb-1" style={headingShadow}>Did it pass?</Text>
              <Text className="text-text-secondary text-base mb-6">Honest answer.</Text>
              {reasonNames && <View className="mb-8"><Text className="text-text-muted text-sm font-semibold tracking-widest uppercase mb-1">Remember</Text><Text className="text-text-primary text-2xl font-semibold">{reasonNames}.</Text></View>}
              <View style={{ gap: 12 }}>
                <PressScale onPress={handleUrgePassed} className="bg-urge-surface rounded-2xl border border-white/20" style={{ paddingHorizontal: 20, paddingVertical: 22, shadowColor: '#120D17', shadowOpacity: 0.8, shadowRadius: 10, shadowOffset: { width: 0, height: 5 } }}><Text className="text-text-primary text-lg font-semibold mb-1">It passed.</Text><Text className="text-text-muted text-base">Good. Keep going.</Text></PressScale>
                <PressScale onPress={handleDrinkAnyway} className="bg-urge-surface rounded-2xl border border-white/8" style={{ paddingHorizontal: 20, paddingVertical: 22, shadowColor: '#120D17', shadowOpacity: 0.8, shadowRadius: 10, shadowOffset: { width: 0, height: 5 } }}><Text className="text-text-primary text-lg font-semibold mb-1">I'm going to drink anyway.</Text><Text className="text-text-muted text-base">We'll be here. Session logged.</Text></PressScale>
              </View>
            </Animated.View>
          )}

          {phase === 'passed' && (
            <Animated.View entering={FadeIn.duration(500)} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 480 }}>
              <Text className="text-text-muted text-sm font-semibold tracking-widest uppercase mb-4">Logged</Text>
              <Text className="text-text-primary text-4xl font-semibold tracking-tight mb-3" style={celebrationGlow}>It passed.</Text>
              <CompanionArt source={pose('smile')} width={74} height={88} />
              <Text className="text-text-secondary text-lg text-center leading-relaxed mb-12 mt-4 px-4">{survivedCount <= 1 ? 'You got through your first one.' : `That's ${survivedCount} times you've got through it.`}{'\n'}Proof this works.</Text>
              <Button title="Done" variant="primary" size="lg" fullWidth onPress={() => router.back()} />
            </Animated.View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeArea>
  );
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  return (
    <Animated.View entering={FadeInDown.duration(300).springify()} className={`flex-row mb-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <View className={`max-w-[86%] px-4 py-3 rounded-2xl ${isUser ? 'bg-accent rounded-tr-sm' : 'bg-surface-2 rounded-tl-sm'}`}>
        <Text className={`text-base leading-relaxed ${isUser ? 'text-white' : 'text-text-primary'}`}>{message.content}</Text>
      </View>
    </Animated.View>
  );
}
