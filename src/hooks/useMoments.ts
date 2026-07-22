import { useQuery, useMutation } from '@tanstack/react-query';
import * as FileSystem from 'expo-file-system';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';
import { useAuthStore } from '@/store/authStore';

const BUCKET = 'moments';

/**
 * Streams a local file straight to Supabase Storage's REST endpoint.
 *
 * We deliberately do NOT use `fetch(uri).arrayBuffer()` + `storage.upload()`:
 * in React Native that pattern loads the whole file into JS memory and then
 * hangs indefinitely for anything larger than a small photo (videos never
 * resolve). `FileSystem.uploadAsync` streams the bytes from disk, so videos
 * upload reliably. The user's JWT is sent so storage RLS still applies.
 */
async function uploadToStorage(
  path: string,
  fileUri: string,
  contentType: string,
  onProgress?: (fraction: number) => void,
) {
  // Let supabase-js (correctly authenticated) mint a one-time signed upload
  // URL — this is where RLS is enforced, as the real user. Hand-rolling the
  // Authorization header on a raw REST upload made storage treat the request
  // as anonymous, so RLS rejected it ("new row violates row-level security").
  const { data: signed, error: signErr } = await (supabase.storage as any)
    .from(BUCKET)
    .createSignedUploadUrl(path);
  if (signErr || !signed?.signedUrl) {
    throw signErr ?? new Error('could not create upload url');
  }

  // Stream the bytes to the pre-authorised signed URL (PUT). createUploadTask
  // (not uploadAsync) reports real byte progress; the URL carries its own
  // token, so no auth header is needed here.
  const task = FileSystem.createUploadTask(
    signed.signedUrl,
    fileUri,
    {
      httpMethod: 'PUT',
      uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
      headers: {
        'Content-Type': contentType,
        'x-upsert': 'true',
        'cache-control': '3600',
      },
    },
    (p) => {
      if (onProgress && p.totalBytesExpectedToSend > 0) {
        onProgress(p.totalBytesSent / p.totalBytesExpectedToSend);
      }
    },
  );
  const result = await task.uploadAsync();
  if (!result || (result.status !== 200 && result.status !== 201)) {
    throw new Error(`storage upload failed (${result?.status}): ${result?.body}`);
  }
}

export interface FeedMoment {
  id: string;
  created_at: string;
  media_type: 'photo' | 'video';
  caption: string | null;
  url: string | null;
  thumb_url: string | null;
  username: string | null; // null when the post is anonymous
}

export interface MyMoment {
  id: string;
  created_at: string;
  media_path: string;
  media_type: 'photo' | 'video';
  thumb_path: string | null;
  caption: string | null;
  shared: boolean;
  moderation_status: string; // 'private' | 'pending' | 'approved' | 'rejected'
  url: string | null; // signed preview (thumb for video, the photo otherwise)
  mediaUrl: string | null; // signed full media — the video/photo itself, to play/open
}

function randomId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/** The community feed — shared + approved moments, via the service-role fn. */
export function useCommunityMoments() {
  return useQuery({
    queryKey: ['community-moments'],
    queryFn: async (): Promise<FeedMoment[]> => {
      const { data, error } = await supabase.functions.invoke('good-feed', {
        body: { limit: 40 },
      });
      if (error) throw error;
      return (data?.items ?? []) as FeedMoment[];
    },
    staleTime: 60_000,
  });
}

/** The user's own moments (private gallery), with signed URLs for own media. */
export function useMyMoments() {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: ['my-moments', userId],
    queryFn: async (): Promise<MyMoment[]> => {
      const { data } = await (supabase as any)
        .from('moments')
        .select('*')
        .eq('user_id', userId!)
        .order('created_at', { ascending: false });
      const rows = (data ?? []) as any[];
      return Promise.all(
        rows.map(async (m) => {
          // Preview = thumb for videos, the photo itself otherwise.
          const { data: preview } = await supabase.storage
            .from(BUCKET)
            .createSignedUrl(m.thumb_path ?? m.media_path, 3600);
          // Full media = the actual video/photo, for playing/opening.
          const media = m.thumb_path
            ? await supabase.storage.from(BUCKET).createSignedUrl(m.media_path, 3600)
            : { data: preview };
          return {
            ...m,
            url: preview?.signedUrl ?? null,
            mediaUrl: media.data?.signedUrl ?? null,
          } as MyMoment;
        }),
      );
    },
    enabled: !!userId,
  });
}

export function useUploadMoment() {
  const userId = useAuthStore((s) => s.user?.id);
  return useMutation({
    mutationFn: async (opts: {
      uri: string;
      mediaType: 'photo' | 'video';
      thumbUri?: string;
      caption?: string;
      shared: boolean;
      anonymous: boolean;
      ext?: string;
      onProgress?: (fraction: number) => void;
    }) => {
      if (!userId) throw new Error('not signed in');
      const id = randomId();
      const ext = opts.ext ?? (opts.mediaType === 'video' ? 'mp4' : 'jpg');
      // Shared media lives under shared/ (no user-id in the path) so anonymous
      // posts reveal nothing; private media lives under the user's own prefix.
      const prefix = opts.shared ? 'shared' : userId;
      const media_path = `${prefix}/${id}.${ext}`;

      const contentType =
        opts.mediaType === 'video'
          ? ext === 'mov'
            ? 'video/quicktime'
            : 'video/mp4'
          : ext === 'png'
            ? 'image/png'
            : 'image/jpeg';
      // The media file is the bulk of the work — map it to 0–92%, leaving a
      // little headroom for the thumbnail and the DB write so the bar finishes.
      await uploadToStorage(media_path, opts.uri, contentType, (f) =>
        opts.onProgress?.(f * 0.92),
      );

      // Videos get a first-frame thumbnail (feed grid + what moderation screens).
      let thumb_path: string | null = null;
      if (opts.mediaType === 'video' && opts.thumbUri) {
        thumb_path = `${prefix}/${id}_t.jpg`;
        await uploadToStorage(thumb_path, opts.thumbUri, 'image/jpeg', (f) =>
          opts.onProgress?.(0.92 + f * 0.05),
        );
      }
      opts.onProgress?.(0.98);

      const { data: row, error } = await (supabase as any)
        .from('moments')
        .insert({
          user_id: userId,
          media_path,
          media_type: opts.mediaType,
          thumb_path,
          caption: opts.caption?.trim() || null,
          shared: opts.shared,
          anonymous: opts.anonymous,
          moderation_status: opts.shared ? 'pending' : 'private',
        })
        .select('id')
        .single();
      if (error) throw error;
      opts.onProgress?.(1);

      // Fire moderation for shared moments — the feed only ever shows approved.
      if (opts.shared && row?.id) {
        supabase.functions
          .invoke('moderate-moment', { body: { momentId: row.id } })
          .catch(() => {});
      }
      return row;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-moments'] });
      queryClient.invalidateQueries({ queryKey: ['community-moments'] });
    },
  });
}

export function useDeleteMoment() {
  return useMutation({
    mutationFn: async (m: { id: string; media_path: string; thumb_path?: string | null }) => {
      const paths = [m.media_path, ...(m.thumb_path ? [m.thumb_path] : [])];
      await supabase.storage.from(BUCKET).remove(paths).catch(() => {});
      const { error } = await (supabase as any).from('moments').delete().eq('id', m.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-moments'] });
      queryClient.invalidateQueries({ queryKey: ['community-moments'] });
    },
  });
}
