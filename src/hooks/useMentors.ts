import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';
import { useAuthStore } from '@/store/authStore';

export function useAvailableMentors() {
  return useQuery({
    queryKey: ['mentors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mentor_profiles')
        .select('*, profiles(username)')
        .eq('is_available', true)
        .order('total_sessions', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useRequestMentor() {
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation({
    mutationFn: async ({
      mentorId,
      message,
    }: {
      mentorId: string;
      message?: string;
    }) => {
      const { data, error } = await supabase
        .from('mentor_requests')
        .insert({
          requester_id: userId!,
          mentor_id: mentorId,
          status: 'pending',
          message: message ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-requests'] });
    },
  });
}

export function useMyMentorRequests() {
  const userId = useAuthStore((s) => s.user?.id);

  return useQuery({
    queryKey: ['my-requests', userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('mentor_requests')
        .select('*, mentor_profiles(*, profiles(username))')
        .eq('requester_id', userId!)
        .order('created_at', { ascending: false });
      return data ?? [];
    },
    enabled: !!userId,
  });
}
