import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';
import { useAuthStore } from '@/store/authStore';

export type JournalNote = {
  id: string;
  user_id: string;
  created_at: string;
  text: string | null;
  audio_path: string | null;
  duration_seconds: number | null;
};

const BUCKET = 'voice-journals';

export function useJournalNotes() {
  const userId = useAuthStore((s) => s.user?.id);

  return useQuery({
    queryKey: ['journal-notes', userId],
    queryFn: async (): Promise<JournalNote[]> => {
      const { data, error } = await supabase
        .from('journal_notes')
        .select('*')
        .eq('user_id', userId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as JournalNote[];
    },
    enabled: !!userId,
  });
}

export function useAddTextNote() {
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation({
    mutationFn: async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) throw new Error('Empty note');
      const { error } = await supabase
        .from('journal_notes')
        .insert({ user_id: userId!, text: trimmed });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-notes', userId] });
    },
  });
}

export function useAddVoiceNote() {
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation({
    mutationFn: async ({
      localUri,
      durationSeconds,
    }: {
      localUri: string;
      durationSeconds: number;
    }) => {
      const path = `${userId}/${Date.now()}.m4a`;

      // React Native upload: fetch the local file into an ArrayBuffer.
      const response = await fetch(localUri);
      const arrayBuffer = await response.arrayBuffer();

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, arrayBuffer, { contentType: 'audio/m4a' });
      if (uploadError) throw uploadError;

      const { error } = await supabase.from('journal_notes').insert({
        user_id: userId!,
        audio_path: path,
        duration_seconds: Math.round(durationSeconds),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-notes', userId] });
    },
  });
}

export function useDeleteNote() {
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation({
    mutationFn: async (note: JournalNote) => {
      if (note.audio_path) {
        await supabase.storage.from(BUCKET).remove([note.audio_path]);
      }
      const { error } = await supabase
        .from('journal_notes')
        .delete()
        .eq('id', note.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-notes', userId] });
    },
  });
}

/** Short-lived signed URL for playing a voice note. */
export async function getAudioUrl(audioPath: string): Promise<string | null> {
  const { data } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(audioPath, 60 * 60);
  return data?.signedUrl ?? null;
}
