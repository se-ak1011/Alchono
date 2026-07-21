import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Personal-data tables keyed by user_id. Deleting these + resetting the
// profile gives the user a clean slate without deleting their account.
const USER_TABLES = [
  'ai_conversations',
  'alcohol_free_days',
  'community_posts',
  'daily_checkins',
  'daily_choices',
  'drinking_sessions',
  'goals',
  'journal_entries',
  'journal_notes',
  'letters',
  'milestones',
  'moments',
  'notification_preferences',
  'support_taps',
  'urge_events',
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Unauthorized');

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    const asUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: authError } = await asUser.auth.getUser();
    if (authError || !user) throw new Error('Unauthorized');
    const uid = user.id;

    // Remove this user's stored media before dropping the DB rows.
    try {
      const { data: mine } = await admin
        .from('moments')
        .select('media_path, thumb_path')
        .eq('user_id', uid);
      const paths = (mine ?? [])
        .flatMap((m: any) => [m.media_path, m.thumb_path])
        .filter(Boolean);
      if (paths.length > 0) await admin.storage.from('moments').remove(paths);
    } catch {
      // best-effort
    }
    try {
      const { data: vj } = await admin.storage
        .from('voice-journals')
        .list(uid, { limit: 1000 });
      if (vj && vj.length > 0) {
        await admin.storage
          .from('voice-journals')
          .remove(vj.map((f) => `${uid}/${f.name}`));
      }
    } catch {
      // best-effort
    }

    // Delete personal data (best-effort per table so one failure doesn't
    // abort the whole reset).
    const failed: string[] = [];
    for (const table of USER_TABLES) {
      const { error } = await admin.from(table).delete().eq('user_id', uid);
      if (error) failed.push(`${table}: ${error.message}`);
    }

    // Reset the profile back to a pre-onboarding state — keep the account,
    // username and email.
    const { error: profileError } = await admin
      .from('profiles')
      .update({ onboarding_completed: false, preferences: {} })
      .eq('id', uid);
    if (profileError) throw profileError;

    return new Response(JSON.stringify({ success: true, failed }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
