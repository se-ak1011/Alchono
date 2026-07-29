import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// The self-contained community feed. Runs with the service role so it can read
// shared media from the private 'moments' bucket and sign short-lived URLs —
// and so it can enforce anonymity server-side: a username is only ever returned
// when the post is NOT anonymous, and a poster's user_id NEVER leaves here.
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    const { limit = 30, before, action, momentId } = await req.json().catch(() => ({}));

    // Full media URLs are minted only after a tap; feed requests never sign or
    // encourage loading every video while somebody scrolls.
    if (action === 'play') {
      if (!momentId) throw new Error('momentId required');
      const { data: moment, error: momentError } = await supabase
        .from('moments').select('media_path, media_type')
        .eq('id', momentId).eq('shared', true).eq('moderation_status', 'approved')
        .maybeSingle();
      if (momentError) throw momentError;
      if (!moment || moment.media_type !== 'video') {
        return new Response(JSON.stringify({ error: 'video unavailable' }), {
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const { data: signed, error: signError } = await supabase.storage
        .from('moments').createSignedUrl(moment.media_path, 900);
      if (signError) throw signError;
      return new Response(JSON.stringify({ url: signed?.signedUrl ?? null }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let query = supabase
      .from('moments')
      .select('id, created_at, media_path, media_type, thumb_path, caption, caption_position, anonymous, user_id')
      .eq('shared', true)
      .eq('moderation_status', 'approved')
      .order('created_at', { ascending: false })
      .limit(Math.min(Number(limit) || 30, 50));
    if (before) query = query.lt('created_at', before);

    const { data: rows, error } = await query;
    if (error) throw error;

    const namedUserIds = [...new Set((rows ?? []).filter((m: any) => !m.anonymous).map((m: any) => m.user_id))];
    const { data: profiles } = namedUserIds.length
      ? await supabase.from('profiles').select('id, username').in('id', namedUserIds)
      : { data: [] };
    const usernames = new Map((profiles ?? []).map((profile: any) => [profile.id, profile.username]));

    const items = await Promise.all((rows ?? []).map(async (m: any) => {
      // Photos use their media as the preview. Videos use only the small poster;
      // their full URL is deliberately omitted until the play action above.
      const previewPath = m.media_type === 'video' ? m.thumb_path : m.media_path;
      const preview = previewPath
        ? await supabase.storage.from('moments').createSignedUrl(previewPath, 3600)
        : { data: null };

      return {
        id: m.id,
        created_at: m.created_at,
        media_type: m.media_type,
        caption: m.caption,
        caption_position: m.caption_position ?? null,
        url: m.media_type === 'photo' ? (preview as any).data?.signedUrl ?? null : null,
        thumb_url: m.media_type === 'video' ? (preview as any).data?.signedUrl ?? null : null,
        username: m.anonymous ? null : usernames.get(m.user_id) ?? null,
      };
    }));

    return new Response(JSON.stringify({ items }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[good-feed] FAILED', error);
    return new Response(JSON.stringify({ error: String(error), items: [] }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
