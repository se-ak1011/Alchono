import { useState, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';
import { useAuthStore } from '@/store/authStore';
import type { ChatMessage } from '@/types';

export function useAiConversation(sessionType = 'general') {
  const userId = useAuthStore((s) => s.user?.id);

  return useQuery({
    queryKey: ['ai-conversation', userId, sessionType],
    queryFn: async () => {
      const { data } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('user_id', userId!)
        .eq('session_type', sessionType)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!userId,
  });
}

export function useAiCoach(sessionType = 'general') {
  const userId = useAuthStore((s) => s.user?.id);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '0',
      role: 'assistant',
      content:
        "Hi, I'm here whenever you need to talk. What's on your mind today?",
      timestamp: new Date().toISOString(),
    },
  ]);
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

        const { data, error } = await supabase.functions.invoke('open-ai', {
          body: {
            messages: allMessages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            sessionType,
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
      } catch {
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
