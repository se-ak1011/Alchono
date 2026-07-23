import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
// Infrequent + cached + curated, so quality is worth it here (unlike the
// high-frequency coach). Sonnet writes warmer humour and better dilemmas.
const MODEL = 'claude-sonnet-5';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GIGGLES_PROMPT = (n: number) => `Write ${n} ORIGINAL, light-hearted, wholesome short stories for a "Food for the Giggles" feed inside a calm alcohol-recovery app.

Rules:
- Completely original. Do NOT copy or quote any real post or article. Invent everything.
- First person, natural and conversational, like someone telling a mate.
- 1–3 short paragraphs each. Genuinely warm and funny, never mean.
- Vary the flavour across: harmless malicious compliance, gentle petty revenge, funny misunderstandings, workplace humour, customer-service moments, wholesome animal antics, everyday mishaps.
- No real or identifiable people, brands, politics, cruelty, sexual content, or anything dark. Nothing about alcohol, drugs or recovery.
- Give each a short, playful title.

Return ONLY a JSON array, no prose, no markdown fences:
[{"title": "...", "body": "...", "category": "misunderstanding"}]`;

const DILEMMAS_PROMPT = (n: number) => `Write ${n} ORIGINAL first-person moral dilemmas for a "Food for Thought" feed inside a calm alcohol-recovery app, where readers vote on who was in the wrong.

Rules:
- Completely original. You may be INSPIRED by the kind of everyday situations people discuss online, but invent all wording, names, places and details. Do NOT copy anything.
- Everyday, relatable situations: family, friends, flatmates, weddings, money between friends, neighbours, work, etiquette, gifts, group trips.
- Genuinely ambiguous — reasonable people should disagree. End without resolving it.
- Keep it light-to-moderate and NON-triggering: no addiction, alcohol, drugs, self-harm, abuse, violence, infidelity or grief as the core. No politics.
- First person, 2–3 short paragraphs. End with the narrator unsure if they were unreasonable.
- Give each a short, plain title (no "AITA").

Return ONLY a JSON array, no prose, no markdown fences:
[{"title": "...", "story": "..."}]`;

async function generate(prompt: string): Promise<any[]> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 3000,
      temperature: 1,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  const data = await res.json();
  if (!res.ok || data.type === 'error') {
    throw new Error(`Anthropic ${res.status}: ${data.error?.message ?? JSON.stringify(data)}`);
  }
  const text: string = data.content?.[0]?.text ?? '';
  // Be forgiving: strip fences, then take the outermost [ ... ].
  const cleaned = text.replace(/```json/gi, '').replace(/```/g, '');
  const start = cleaned.indexOf('[');
  const end = cleaned.lastIndexOf(']');
  if (start === -1 || end === -1) return [];
  try {
    const arr = JSON.parse(cleaned.slice(start, end + 1));
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    if (!ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY is not set');

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Only admins may generate — verify the caller's JWT against the admins table.
    const jwt = (req.headers.get('Authorization') ?? '').replace('Bearer ', '');
    const { data: userData } = await admin.auth.getUser(jwt);
    const uid = userData?.user?.id;
    if (!uid) return new Response(JSON.stringify({ error: 'unauthenticated' }), { status: 401, headers: corsHeaders });
    const { data: adminRow } = await admin.from('admins').select('user_id').eq('user_id', uid).maybeSingle();
    if (!adminRow) return new Response(JSON.stringify({ error: 'not an admin' }), { status: 403, headers: corsHeaders });

    const { kind = 'both', giggles = 6, dilemmas = 4 } = await req.json().catch(() => ({}));
    let insertedGiggles = 0;
    let insertedDilemmas = 0;

    if (kind === 'giggles' || kind === 'both') {
      const items = await generate(GIGGLES_PROMPT(giggles));
      const rows = items
        .filter((it) => it?.title && it?.body)
        .map((it) => ({ kind: 'giggle', title: String(it.title).slice(0, 200), body: String(it.body).slice(0, 4000), category: it.category ? String(it.category).slice(0, 40) : null, published: false }));
      if (rows.length) {
        const { error } = await admin.from('curated_stories').insert(rows);
        if (!error) insertedGiggles = rows.length;
      }
    }

    if (kind === 'dilemmas' || kind === 'both') {
      const items = await generate(DILEMMAS_PROMPT(dilemmas));
      const rows = items
        .filter((it) => it?.title && it?.story)
        .map((it) => ({ title: String(it.title).slice(0, 200), story: String(it.story).slice(0, 4000), published: false }));
      if (rows.length) {
        const { error } = await admin.from('dilemmas').insert(rows);
        if (!error) insertedDilemmas = rows.length;
      }
    }

    return new Response(
      JSON.stringify({ ok: true, giggles: insertedGiggles, dilemmas: insertedDilemmas }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('[generate-content] FAILED', error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
