import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
// Content is generated infrequently and cached, so prefer Sonnet's stronger
// writing quality here; the high-frequency AI coach intentionally uses Haiku.
const MODEL = Deno.env.get('ANTHROPIC_CONTENT_MODEL') ?? 'claude-sonnet-4-5';

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
- Submit every completed item through the provided tool.`;

const DILEMMAS_PROMPT = (n: number) => `Write ${n} ORIGINAL first-person moral dilemmas for a "Food for Thought" feed inside a calm alcohol-recovery app, where readers vote on who was in the wrong.

Rules:
- Completely original. You may be INSPIRED by the kind of everyday situations people discuss online, but invent all wording, names, places and details. Do NOT copy anything.
- Everyday, relatable situations: family, friends, flatmates, weddings, money between friends, neighbours, work, etiquette, gifts, group trips.
- Genuinely ambiguous — reasonable people should disagree. End without resolving it.
- Keep it light-to-moderate and NON-triggering: no addiction, alcohol, drugs, self-harm, abuse, violence, infidelity or grief as the core. No politics.
- First person, 2–3 short paragraphs. End with the narrator unsure if they were unreasonable.
- Give each a short, plain title (no "AITA").
- Submit every completed item through the provided tool.`;

const GIGGLE_ITEM_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    body: { type: 'string' },
    category: { type: 'string' },
  },
  required: ['title', 'body'],
  additionalProperties: false,
};

const DILEMMA_ITEM_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    story: { type: 'string' },
  },
  required: ['title', 'story'],
  additionalProperties: false,
};

async function claude(prompt: string, maxTokens: number): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      temperature: prompt.startsWith('REVIEW') ? 0 : 1,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  const data = await res.json();
  if (!res.ok || data.type === 'error') {
    throw new Error(`Anthropic ${res.status}: ${data.error?.message ?? JSON.stringify(data)}`);
  }
  return data.content?.[0]?.text ?? '';
}

function parseArray(text: string): any[] {
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

/**
 * A strict second-lens moderation pass — like moderate-moment for the feed.
 * Returns a boolean per item: true = safe to auto-publish. Anything it can't
 * confidently approve comes back false and waits for a human.
 */
async function review(items: { text: string }[], kind: 'giggle' | 'dilemma'): Promise<boolean[]> {
  if (items.length === 0) return [];
  const rubric =
    kind === 'giggle'
      ? 'Approve ONLY if it is genuinely wholesome and light: no cruelty, meanness, politics, sexual content, or anything dark; nothing about alcohol, drugs, or recovery; no real or identifiable people; and it is actually kind and appropriate for people in a vulnerable moment.'
      : 'Approve ONLY if it is an everyday, NON-triggering moral dilemma: nothing about addiction, alcohol, drugs, self-harm, abuse, violence, infidelity or grief as the core; no politics; genuinely ambiguous; and appropriate for people in a vulnerable moment.';
  const list = items.map((it, i) => `#${i + 1}:\n${it.text}`).join('\n\n');
  const prompt = `REVIEW. You are a strict content reviewer for a calm alcohol-recovery app. ${rubric}\n\nReview each numbered item and return ONLY a JSON array, one object per item:\n[{"i": 1, "ok": true}]\n\nItems:\n\n${list}`;
  try {
    const text = await claude(prompt, 800);
    const verdicts = parseArray(text) as { i: number; ok: boolean }[];
    return items.map((_, idx) => {
      const v = verdicts.find((x) => Number(x.i) === idx + 1);
      return v ? v.ok === true : false; // unknown → hold for a human
    });
  } catch {
    return items.map(() => false); // review failed → hold, don't auto-publish
  }
}

async function generate(
  prompt: string,
  toolName: string,
  itemSchema: Record<string, unknown>,
): Promise<any[]> {
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
      tools: [{
        name: toolName,
        description: 'Submit the completed content batch.',
        input_schema: {
          type: 'object',
          properties: { items: { type: 'array', items: itemSchema } },
          required: ['items'],
          additionalProperties: false,
        },
      }],
      tool_choice: { type: 'tool', name: toolName },
    }),
  });
  const data = await res.json();
  if (!res.ok || data.type === 'error') {
    throw new Error(`Anthropic ${res.status}: ${data.error?.message ?? JSON.stringify(data)}`);
  }
  const toolUse = data.content?.find(
    (block: { type?: string; name?: string }) => block.type === 'tool_use' && block.name === toolName,
  );
  const items = toolUse?.input?.items;
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error(`Anthropic returned no structured items for ${toolName}`);
  }
  return items;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    console.log('[generate-content] invoked', {
      hasApiKey: !!ANTHROPIC_API_KEY,
      model: MODEL,
    });
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
    const emptyResult = () => ({ received: 0, valid: 0, published: 0, held: 0 });
    const out = {
      published: 0,
      held: 0,
      giggles: emptyResult(),
      dilemmas: emptyResult(),
    };

    if (kind === 'giggles' || kind === 'both') {
      const generated = await generate(GIGGLES_PROMPT(giggles), 'submit_giggles', GIGGLE_ITEM_SCHEMA);
      const items = generated.filter((it) => it?.title && it?.body);
      out.giggles.received = generated.length;
      out.giggles.valid = items.length;
      if (items.length === 0) {
        throw new Error(`Giggles contained no valid title/body items; keys: ${Object.keys(generated[0] ?? {}).join(', ')}`);
      }
      const verdicts = await review(items.map((it) => ({ text: `${it.title}\n${it.body}` })), 'giggle');
      const rows = items.map((it, i) => ({
        kind: 'giggle',
        title: String(it.title).slice(0, 200),
        body: String(it.body).slice(0, 4000),
        category: it.category ? String(it.category).slice(0, 40) : null,
        published: verdicts[i] === true,
      }));
      if (rows.length) {
        const { error } = await admin.from('curated_stories').insert(rows);
        if (error) throw new Error(`Could not save Giggles: ${error.message}`);
        out.giggles.published = rows.filter((r) => r.published).length;
        out.giggles.held = rows.filter((r) => !r.published).length;
        out.published += out.giggles.published;
        out.held += out.giggles.held;
      }
    }

    if (kind === 'dilemmas' || kind === 'both') {
      const generated = await generate(DILEMMAS_PROMPT(dilemmas), 'submit_dilemmas', DILEMMA_ITEM_SCHEMA);
      const items = generated.filter((it) => it?.title && it?.story);
      out.dilemmas.received = generated.length;
      out.dilemmas.valid = items.length;
      if (items.length === 0) {
        throw new Error(`Dilemmas contained no valid title/story items; keys: ${Object.keys(generated[0] ?? {}).join(', ')}`);
      }
      const verdicts = await review(items.map((it) => ({ text: `${it.title}\n${it.story}` })), 'dilemma');
      const rows = items.map((it, i) => ({
        title: String(it.title).slice(0, 200),
        story: String(it.story).slice(0, 4000),
        published: verdicts[i] === true,
      }));
      if (rows.length) {
        const { error } = await admin.from('dilemmas').insert(rows);
        if (error) throw new Error(`Could not save dilemmas: ${error.message}`);
        out.dilemmas.published = rows.filter((r) => r.published).length;
        out.dilemmas.held = rows.filter((r) => !r.published).length;
        out.published += out.dilemmas.published;
        out.held += out.dilemmas.held;
      }
    }

    // published = auto-approved and live; held = waiting for a human.
    return new Response(JSON.stringify({ ok: true, ...out }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[generate-content] FAILED', error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
