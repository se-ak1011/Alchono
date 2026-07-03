import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';
import { useAuthStore } from '@/store/authStore';
import { fetchUsernames } from '@/lib/publicProfiles';

export function useAvailableMentors() {
  return useQuery({
    queryKey: ['mentors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mentor_profiles')
        .select('*')
        .eq('is_available', true)
        .order('total_sessions', { ascending: false });
      if (error) throw error;
      if (!data || data.length === 0) return [];

      // profiles is owner-only under RLS — usernames come from the
      // public_profiles view instead.
      const names = await fetchUsernames(data.map((m) => m.user_id));
      return data.map((m) => ({ ...m, username: names[m.user_id] ?? 'Mentor' }));
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
        .select('*')
        .eq('requester_id', userId!)
        .order('created_at', { ascending: false });
      if (!data || data.length === 0) return [];
      const names = await fetchUsernames(data.map((r) => r.mentor_id));
      return data.map((r) => ({ ...r, mentorUsername: names[r.mentor_id] ?? 'Mentor' }));
    },
    enabled: !!userId,
  });
}

export function useMyMentorProfile() {
  const userId = useAuthStore((s) => s.user?.id);

  return useQuery({
    queryKey: ['my-mentor-profile', userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('mentor_profiles')
        .select('*')
        .eq('user_id', userId!)
        .maybeSingle();
      return data;
    },
    enabled: !!userId,
  });
}

export function useSaveMentorProfile() {
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation({
    mutationFn: async ({
      recoveryLevel,
      bio,
      isAvailable,
    }: {
      recoveryLevel: string;
      bio: string;
      isAvailable: boolean;
    }) => {
      const { data, error } = await supabase
        .from('mentor_profiles')
        .upsert(
          {
            user_id: userId!,
            recovery_level: recoveryLevel,
            bio: bio.trim() || null,
            is_available: isAvailable,
            is_rural:
              ((useAuthStore.getState().profile?.preferences as any)
                ?.livesIsolated ?? false) === true,
          },
          { onConflict: 'user_id' },
        )
        .select()
        .single();
      if (error) throw error;

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ is_mentor: true, mentor_recovery_level: recoveryLevel })
        .eq('id', userId!);
      if (profileError) throw profileError;

      const { profile, setProfile } = useAuthStore.getState();
      if (profile) {
        setProfile({ ...profile, is_mentor: true, mentor_recovery_level: recoveryLevel });
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-mentor-profile', userId] });
      queryClient.invalidateQueries({ queryKey: ['mentors'] });
    },
  });
}

export function useStopMentoring() {
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('mentor_profiles')
        .delete()
        .eq('user_id', userId!);
      if (error) throw error;

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ is_mentor: false, mentor_recovery_level: null })
        .eq('id', userId!);
      if (profileError) throw profileError;

      const { profile, setProfile } = useAuthStore.getState();
      if (profile) {
        setProfile({ ...profile, is_mentor: false, mentor_recovery_level: null });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-mentor-profile', userId] });
      queryClient.invalidateQueries({ queryKey: ['mentors'] });
    },
  });
}
