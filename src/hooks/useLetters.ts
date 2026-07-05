import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';
import { useAuthStore } from '@/store/authStore';

export interface Letter {
  id: string;
  user_id: string;
  created_at: string;
  body: string;
  deliver_at: string;
  delivered_at: string | null;
  reaction: string | null;
}

export type DeliveryChoice = '30d' | '90d' | '6m' | '1y' | 'surprise';

export const DELIVERY_OPTIONS: { key: DeliveryChoice; label: string }[] = [
  { key: '30d', label: '30 days' },
  { key: '90d', label: '90 days' },
  { key: '6m', label: '6 months' },
  { key: '1y', label: '1 year' },
  { key: 'surprise', label: 'Surprise me' },
];

function deliverAtFor(choice: DeliveryChoice): Date {
  const d = new Date();
  switch (choice) {
    case '30d':
      d.setDate(d.getDate() + 30);
      break;
    case '90d':
      d.setDate(d.getDate() + 90);
      break;
    case '6m':
      d.setMonth(d.getMonth() + 6);
      break;
    case '1y':
      d.setFullYear(d.getFullYear() + 1);
      break;
    case 'surprise': {
      // A random day between 1 and 12 months out — the user never knows when.
      const days = 30 + Math.floor(Math.random() * (365 - 30));
      d.setDate(d.getDate() + days);
      break;
    }
  }
  return d;
}

export function daysAgo(iso: string): number {
  const ms = Date.now() - new Date(iso).getTime();
  return Math.max(0, Math.round(ms / 86_400_000));
}

export function useWriteLetter() {
  const userId = useAuthStore((s) => s.user?.id);
  return useMutation({
    mutationFn: async ({ body, choice }: { body: string; choice: DeliveryChoice }) => {
      if (!userId) throw new Error('not signed in');
      const deliver_at = deliverAtFor(choice).toISOString();
      const { error } = await (supabase as any)
        .from('letters')
        .insert({ user_id: userId, body: body.trim(), deliver_at });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['letters'] });
      queryClient.invalidateQueries({ queryKey: ['letter-due'] });
    },
  });
}

export function useLetters() {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: ['letters', userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('letters' as any)
        .select('*')
        .eq('user_id', userId!)
        .order('created_at', { ascending: false });
      return (data ?? []) as unknown as Letter[];
    },
    enabled: !!userId,
  });
}

/**
 * The one letter to surface right now: due (deliver_at has passed), not yet
 * delivered, oldest first. Returns null when nothing is waiting.
 */
export function useDueLetter() {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: ['letter-due', userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('letters' as any)
        .select('*')
        .eq('user_id', userId!)
        .is('delivered_at', null)
        .lte('deliver_at', new Date().toISOString())
        .order('deliver_at', { ascending: true })
        .limit(1)
        .maybeSingle();
      return (data ?? null) as unknown as Letter | null;
    },
    enabled: !!userId,
    refetchOnWindowFocus: true,
  });
}

export function useLetter(id?: string) {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: ['letter', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('letters' as any)
        .select('*')
        .eq('id', id!)
        .maybeSingle();
      return (data ?? null) as unknown as Letter | null;
    },
    enabled: !!userId && !!id,
  });
}

/** Mark a letter opened, so it surfaces exactly once. */
export function useMarkDelivered() {
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('letters')
        .update({ delivered_at: new Date().toISOString() })
        .eq('id', id)
        .is('delivered_at', null);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['letter-due'] });
      queryClient.invalidateQueries({ queryKey: ['letters'] });
    },
  });
}

export function useReactToLetter() {
  return useMutation({
    mutationFn: async ({ id, reaction }: { id: string; reaction: string }) => {
      const { error } = await (supabase as any)
        .from('letters')
        .update({ reaction })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['letters'] });
      queryClient.invalidateQueries({ queryKey: ['letter'] });
    },
  });
}
