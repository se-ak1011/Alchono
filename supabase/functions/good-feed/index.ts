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
    const { limit = 30, before } = await req.json().catch(() => ({}));

    let query = supabase
      .from('moments')
      .select('id, created_at, media_path, media_type, thumb_path, caption, anonymous, user_id')
      .eq('shared', true)
      .eq('moderation_status', 'approved')
      .order('created_at', { ascending: false })
      .limit(Math.min(Number(limit) || 30, 50));
    if (before) query = query.lt('created_at', before);

    const { data: rows, error } = await query;
    if (error) throw error;

    const items = await Promise.all((rows ?? []).map(async (m: any) => {
      const signed = await supabase.storage
        .from('moments')
        .createSignedUrl(m.media_path, 3600);
      const thumb = m.thumb_path
        ? await supabase.storage.from('moments').createSignedUrl(m.thumb_path, 3600)
        : { data: null };

      let username: string | null = null;
      if (!m.anonymous) {
        const { data: prof } = await supabase
          .from('profiles').select('username').eq('id', m.user_id).maybeSingle();
        username = prof?.username ?? null;
      }

      return {
        id: m.id,
        created_at: m.created_at,
        media_type: m.media_type,
        caption: m.caption,
        url: signed.data?.signedUrl ?? null,
        thumb_url: (thumb as any).data?.signedUrl ?? null,
        username, // null when anonymous; user_id is never included
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
