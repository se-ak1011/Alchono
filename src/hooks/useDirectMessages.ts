import { useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';
import { useAuthStore } from '@/store/authStore';
import { fetchUsernames } from '@/lib/publicProfiles';

export type DmMessage = {
  id: string;
  thread_id: string;
  sender_id: string;
  created_at: string;
  content: string;
  read_at: string | null;
};

export type DmThread = {
  id: string;
  requester_id: string;
  recipient_id: string;
  status: string;
  created_at: string;
  responded_at: string | null;
};

export const DM_REQUEST_LIMIT = 3;

/**
 * Start (or resume) a message request to another member.
 * Returns the existing thread in either direction if one exists.
 */
export function useSendMessageRequest() {
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation({
    mutationFn: async (recipientId: string): Promise<DmThread> => {
      const { data: existing } = await supabase
        .from('dm_threads')
        .select('*')
        .or(
          `and(requester_id.eq.${userId},recipient_id.eq.${recipientId}),and(requester_id.eq.${recipientId},recipient_id.eq.${userId})`,
        )
        .maybeSingle();
      if (existing) return existing as DmThread;

      const { data, error } = await supabase
        .from('dm_threads')
        .insert({ requester_id: userId!, recipient_id: recipientId })
        .select()
        .single();
      if (error) throw error;
      return data as DmThread;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dm-connections', userId] });
    },
  });
}

/** Pending requests where the current user is the recipient. */
export function useDmInbox() {
  const userId = useAuthStore((s) => s.user?.id);

  return useQuery({
    queryKey: ['dm-inbox', userId],
    queryFn: async () => {
      const { data: threads, error } = await supabase
        .from('dm_threads')
        .select('*')
        .eq('recipient_id', userId!)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (!threads || threads.length === 0) return [];

      const [names, { data: previews }] = await Promise.all([
        fetchUsernames(threads.map((t) => t.requester_id)),
        supabase
          .from('dm_messages')
          .select('*')
          .in('thread_id', threads.map((t) => t.id))
          .order('created_at', { ascending: true }),
      ]);

      return threads.map((t) => ({
        ...t,
        requesterUsername: names[t.requester_id] ?? 'Member',
        previewMessages: ((previews ?? []) as DmMessage[]).filter(
          (m) => m.thread_id === t.id,
        ),
      }));
    },
    enabled: !!userId,
    refetchInterval: 30_000,
  });
}

export function useRespondToDmRequest() {
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation({
    mutationFn: async ({
      threadId,
      accept,
    }: {
      threadId: string;
      accept: boolean;
    }) => {
      const { error } = await supabase
        .from('dm_threads')
        .update({
          status: accept ? 'accepted' : 'declined',
          responded_at: new Date().toISOString(),
        })
        .eq('id', threadId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dm-inbox', userId] });
      queryClient.invalidateQueries({ queryKey: ['dm-connections', userId] });
    },
  });
}

/** Accepted DM threads for the conversations list. */
export function useDmConnections() {
  const userId = useAuthStore((s) => s.user?.id);

  return useQuery({
    queryKey: ['dm-connections', userId],
    queryFn: async () => {
      const { data: threads, error } = await supabase
        .from('dm_threads')
        .select('*')
        .eq('status', 'accepted')
        .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`)
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (!threads || threads.length === 0) return [];

      const otherIds = threads.map((t) =>
        t.requester_id === userId ? t.recipient_id : t.requester_id,
      );
      const threadIds = threads.map((t) => t.id);

      const [names, { data: lastMessages }, { data: unread }] = await Promise.all([
        fetchUsernames(otherIds),
        supabase
          .from('dm_messages')
          .select('*')
          .in('thread_id', threadIds)
          .order('created_at', { ascending: false }),
        supabase
          .from('dm_messages')
          .select('id, thread_id')
          .in('thread_id', threadIds)
          .neq('sender_id', userId!)
          .is('read_at', null),
      ]);

      const lastByThread: Record<string, DmMessage> = {};
      for (const m of (lastMessages ?? []) as DmMessage[]) {
        if (!lastByThread[m.thread_id]) lastByThread[m.thread_id] = m;
      }
      const unreadByThread: Record<string, number> = {};
      for (const m of unread ?? []) {
        unreadByThread[m.thread_id] = (unreadByThread[m.thread_id] ?? 0) + 1;
      }

      return threads.map((t) => {
        const otherUserId = t.requester_id === userId ? t.recipient_id : t.requester_id;
        return {
          threadId: t.id,
          otherUserId,
          otherUsername: names[otherUserId] ?? 'Member',
          lastMessage: lastByThread[t.id] ?? null,
          unreadCount: unreadByThread[t.id] ?? 0,
        };
      });
    },
    enabled: !!userId,
    refetchInterval: 30_000,
  });
}

/**
 * The other participant's city — only ever returned by the DB for ACCEPTED
 * threads (mutual opt-in), and only as the city text, never coordinates.
 */
export function useDmPeerCity(threadId: string | undefined, accepted: boolean) {
  return useQuery({
    queryKey: ['dm-peer-city', threadId],
    queryFn: async () => {
      const { data } = await supabase.rpc('get_peer_city', {
        p_thread_id: threadId!,
      });
      return (data as string | null) ?? null;
    },
    enabled: !!threadId && accepted,
    staleTime: Infinity,
  });
}

export function useDmThreadMeta(threadId: string | undefined) {
  return useQuery({
    queryKey: ['dm-thread', threadId],
    queryFn: async (): Promise<DmThread | null> => {
      const { data } = await supabase
        .from('dm_threads')
        .select('*')
        .eq('id', threadId!)
        .maybeSingle();
      return (data as DmThread) ?? null;
    },
    enabled: !!threadId,
  });
}

/** Messages in one DM thread, kept live via realtime. */
export function useDmMessages(threadId: string | undefined) {
  const query = useQuery({
    queryKey: ['dm-messages', threadId],
    queryFn: async (): Promise<DmMessage[]> => {
      const { data, error } = await supabase
        .from('dm_messages')
        .select('*')
        .eq('thread_id', threadId!)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as DmMessage[];
    },
    enabled: !!threadId,
  });

  useEffect(() => {
    if (!threadId) return;
    const channel = supabase
      .channel(`dm-messages-${threadId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'dm_messages',
          filter: `thread_id=eq.${threadId}`,
        },
        (payload) => {
          const incoming = payload.new as DmMessage;
          queryClient.setQueryData<DmMessage[]>(['dm-messages', threadId], (old) => {
            if (!old) return [incoming];
            if (old.some((m) => m.id === incoming.id)) return old;
            return [...old, incoming];
          });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [threadId]);

  return query;
}

export function useSendDmMessage(threadId: string | undefined) {
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation({
    mutationFn: async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed) throw new Error('Empty message');
      const { data, error } = await supabase
        .from('dm_messages')
        .insert({ thread_id: threadId!, sender_id: userId!, content: trimmed })
        .select()
        .single();
      if (error) throw error;
      return data as DmMessage;
    },
    onSuccess: (message) => {
      queryClient.setQueryData<DmMessage[]>(['dm-messages', threadId], (old) => {
        if (!old) return [message];
        if (old.some((m) => m.id === message.id)) return old;
        return [...old, message];
      });
      queryClient.invalidateQueries({ queryKey: ['dm-connections', userId] });
    },
  });
}

export function useMarkDmThreadRead(threadId: string | undefined) {
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('dm_messages')
        .update({ read_at: new Date().toISOString() })
        .eq('thread_id', threadId!)
        .neq('sender_id', userId!)
        .is('read_at', null);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dm-connections', userId] });
      queryClient.invalidateQueries({ queryKey: ['dm-inbox', userId] });
    },
  });
}
