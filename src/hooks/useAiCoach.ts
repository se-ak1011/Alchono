import { useState, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';
import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';
import { useUrgeStats, useAfMonthCount } from '@/hooks/useVictories';
import type { ChatMessage, UserPreferences } from '@/types';

export function useAiCoach(sessionType = 'general') {
  const userId = useAuthStore((s) => s.user?.id);
  const profile = useAuthStore((s) => s.profile);
  const activeSessionId = useAppStore((s) => s.activeSessionId);
  const { data: urgeStats } = useUrgeStats();
  const { data: afMonth } = useAfMonthCount();
  // Open with the user's name so the coach feels like it already knows them
  // from the very first line — instant, no API call. The AI then adapts using
  // the full context (partner, stats, isolation, etc.) from its first reply.
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const name = profile?.username?.trim();
    return [
      {
        id: '0',
        role: 'assistant',
        content: name
          ? `Hey ${name} — I'm here whenever you need to talk. What's on your mind?`
          : "Hi, I'm here whenever you need to talk. What's on your mind today?",
        timestamp: new Date().toISOString(),
      },
    ];
  });
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!userId) return;

      const userMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsTyping(true);

      try {
        const allMessages = [...messages, userMsg];

        const prefs = (profile?.preferences as UserPreferences | null) ?? null;
        const { data, error } = await supabase.functions.invoke('ai-coach', {
          body: {
            messages: allMessages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            sessionType,
            // First names + their own stats so the coach isn't a stranger.
            context: {
              username: profile?.username ?? null,
              partnerName: prefs?.partnerName?.trim() || null,
              childrenNames: prefs?.childrenNames?.trim() || null,
              petName: prefs?.petName?.trim() || null,
              urgesBeaten: urgeStats?.allTimePassed ?? 0,
              afDaysThisMonth: afMonth ?? 0,
              sessionActive: !!activeSessionId,
              livesIsolated: prefs?.livesIsolated ?? false,
            },
          },
        });

        if (error) throw error;

        const assistantMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.reply ?? "I'm here for you. Tell me more.",
          timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, assistantMsg]);

        await supabase.from('ai_conversations').upsert({
          user_id: userId,
          session_type: sessionType,
          messages: [...allMessages, assistantMsg],
          updated_at: new Date().toISOString(),
        });
      } catch (e) {
        // Surface the real failure in dev logs instead of swallowing it.
        console.error('[useAiCoach] sendMessage failed:', e);
        const fallback: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content:
            "I'm having trouble connecting right now. Please try again in a moment — I'm here whenever you need me.",
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, fallback]);
      } finally {
        setIsTyping(false);
      }
    },
    [messages, userId, sessionType],
  );

  return { messages, isTyping, sendMessage };
}
