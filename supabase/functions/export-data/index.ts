import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Unauthorized');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error('Unauthorized');

    // Collect all user data (RLS scopes every query to this user)
    const [
      { data: profile },
      { data: checkins },
      { data: sessions },
      { data: journal },
      { data: goals },
      { data: posts },
      { data: aiConversations },
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('daily_checkins').select('*').eq('user_id', user.id),
      supabase.from('drinking_sessions').select('*').eq('user_id', user.id),
      supabase.from('journal_entries').select('*').eq('user_id', user.id),
      supabase.from('goals').select('*').eq('user_id', user.id),
      supabase.from('community_posts').select('*').eq('user_id', user.id),
      supabase.from('ai_conversations').select('*').eq('user_id', user.id),
    ]);

    const exportData = {
      exported_at: new Date().toISOString(),
      account_email: user.email,
      profile,
      checkins,
      sessions,
      journal,
      goals,
      community_posts: posts,
      ai_conversations: aiConversations,
    };

    // If a Resend key is configured, also email the export to the user.
    const resendKey = Deno.env.get('RESEND_API_KEY');
    let emailed = false;
    if (resendKey && user.email) {
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: Deno.env.get('EXPORT_FROM_EMAIL') ?? 'Alchono <onboarding@resend.dev>',
            to: [user.email],
            subject: 'Your Alchono data export',
            text: 'Attached is a full export of your Alchono data in JSON format.\n\nIf you did not request this, you can ignore this email — the data was only sent to your own account address.',
            attachments: [
              {
                filename: `alchono-export-${new Date().toISOString().split('T')[0]}.json`,
                content: btoa(unescape(encodeURIComponent(JSON.stringify(exportData, null, 2)))),
              },
            ],
          }),
        });
        emailed = res.ok;
      } catch {
        emailed = false;
      }
    }

    return new Response(JSON.stringify({ emailed, data: exportData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
