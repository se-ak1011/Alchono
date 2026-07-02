import { useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';
import { useAuthStore } from '@/store/authStore';
import { fetchUsernames } from '@/lib/publicProfiles';
import type { Message } from '@/types';

export type Connection = {
  requestId: string;
  otherUserId: string;
  otherUsername: string;
  iAmMentor: boolean;
  lastMessage: Message | null;
  unreadCount: number;
};

/** Accepted mentor connections (either side) with last message + unread count. */
export function useConnections() {
  const userId = useAuthStore((s) => s.user?.id);

  return useQuery({
    queryKey: ['connections', userId],
    queryFn: async (): Promise<Connection[]> => {
      const { data: requests, error } = await supabase
        .from('mentor_requests')
        .select('*')
        .eq('status', 'accepted')
        .or(`requester_id.eq.${userId},mentor_id.eq.${userId}`)
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (!requests || requests.length === 0) return [];

      const otherIds = requests.map((r) =>
        r.mentor_id === userId ? r.requester_id : r.mentor_id,
      );
      const requestIds = requests.map((r) => r.id);

      const [names, { data: lastMessages }, { data: unread }] = await Promise.all([
        fetchUsernames(otherIds),
        supabase
          .from('messages')
          .select('*')
          .in('request_id', requestIds)
          .order('created_at', { ascending: false }),
        supabase
          .from('messages')
          .select('id, request_id')
          .in('request_id', requestIds)
          .neq('sender_id', userId!)
          .is('read_at', null),
      ]);

      const lastByRequest: Record<string, Message> = {};
      for (const m of (lastMessages ?? []) as Message[]) {
        if (!lastByRequest[m.request_id]) lastByRequest[m.request_id] = m;
      }
      const unreadByRequest: Record<string, number> = {};
      for (const m of unread ?? []) {
        unreadByRequest[m.request_id] = (unreadByRequest[m.request_id] ?? 0) + 1;
      }

      return requests.map((r) => {
        const otherUserId = r.mentor_id === userId ? r.requester_id : r.mentor_id;
        return {
          requestId: r.id,
          otherUserId,
          otherUsername: names[otherUserId] ?? 'Member',
          iAmMentor: r.mentor_id === userId,
          lastMessage: lastByRequest[r.id] ?? null,
          unreadCount: unreadByRequest[r.id] ?? 0,
        };
      });
    },
    enabled: !!userId,
    refetchInterval: 30_000,
  });
}

/** Pending requests where the current user is the mentor. */
export function useMentorInbox() {
  const userId = useAuthStore((s) => s.user?.id);
  const isMentor = useAuthStore((s) => s.profile?.is_mentor);

  return useQuery({
    queryKey: ['mentor-inbox', userId],
    queryFn: async () => {
      const { data: requests, error } = await supabase
        .from('mentor_requests')
        .select('*')
        .eq('mentor_id', userId!)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (!requests || requests.length === 0) return [];

      const names = await fetchUsernames(requests.map((r) => r.requester_id));
      return requests.map((r) => ({
        ...r,
        requesterUsername: names[r.requester_id] ?? 'Member',
      }));
    },
    enabled: !!userId && !!isMentor,
    refetchInterval: 30_000,
  });
}

export function useRespondToRequest() {
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation({
    mutationFn: async ({
      requestId,
      accept,
    }: {
      requestId: string;
      accept: boolean;
    }) => {
      const { error } = await supabase
        .from('mentor_requests')
        .update({ status: accept ? 'accepted' : 'declined' })
        .eq('id', requestId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mentor-inbox', userId] });
      queryClient.invalidateQueries({ queryKey: ['connections', userId] });
    },
  });
}

/** Messages in one thread, kept live via realtime. */
export function useThreadMessages(requestId: string | undefined) {
  const query = useQuery({
    queryKey: ['messages', requestId],
    queryFn: async (): Promise<Message[]> => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('request_id', requestId!)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!requestId,
  });

  useEffect(() => {
    if (!requestId) return;
    const channel = supabase
      .channel(`messages-${requestId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `request_id=eq.${requestId}`,
        },
        (payload) => {
          const incoming = payload.new as Message;
          queryClient.setQueryData<Message[]>(['messages', requestId], (old) => {
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
  }, [requestId]);

  return query;
}

export function useSendMessage(requestId: string | undefined) {
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation({
    mutationFn: async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed) throw new Error('Empty message');
      const { data, error } = await supabase
        .from('messages')
        .insert({ request_id: requestId!, sender_id: userId!, content: trimmed })
        .select()
        .single();
      if (error) throw error;
      return data as Message;
    },
    onSuccess: (message) => {
      // Realtime also delivers our own insert; dedupe by id.
      queryClient.setQueryData<Message[]>(['messages', requestId], (old) => {
        if (!old) return [message];
        if (old.some((m) => m.id === message.id)) return old;
        return [...old, message];
      });
      queryClient.invalidateQueries({ queryKey: ['connections', userId] });
    },
  });
}

export function useMarkThreadRead(requestId: string | undefined) {
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('request_id', requestId!)
        .neq('sender_id', userId!)
        .is('read_at', null);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections', userId] });
    },
  });
}

/** Total unread across all threads — for badges. */
export function useUnreadTotal() {
  const userId = useAuthStore((s) => s.user?.id);

  return useQuery({
    queryKey: ['unread-total', userId],
    queryFn: async () => {
      const { count } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .neq('sender_id', userId!)
        .is('read_at', null);
      return count ?? 0;
    },
    enabled: !!userId,
    refetchInterval: 30_000,
  });
}

export function useBlockUser() {
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation({
    mutationFn: async (blockedId: string) => {
      const { error } = await supabase
        .from('user_blocks')
        .upsert(
          { blocker_id: userId!, blocked_id: blockedId },
          { onConflict: 'blocker_id,blocked_id' },
        );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections', userId] });
    },
  });
}

export function useReportUser() {
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation({
    mutationFn: async ({
      reportedUserId,
      requestId,
      reason,
      details,
    }: {
      reportedUserId: string;
      requestId?: string;
      reason: string;
      details?: string;
    }) => {
      const { error } = await supabase.from('reports').insert({
        reporter_id: userId!,
        reported_user_id: reportedUserId,
        request_id: requestId ?? null,
        reason,
        details: details ?? null,
      });
      if (error) throw error;
    },
  });
}
