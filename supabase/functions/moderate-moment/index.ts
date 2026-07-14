import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { encode as base64Encode } from 'https://deno.land/std@0.168.0/encoding/base64.ts';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
// Vision moderation is a classification task — claude-opus-4-8 is the safe
// default; switch this to 'claude-haiku-4-5' to cut cost on a high-volume feed.
const MODEL = 'claude-opus-4-8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM = `You screen images for a supportive alcohol-recovery community feed.
Approve ordinary, wholesome personal moments (nature, pets, food, scenery, crafts,
selfies, everyday life, milestones). REJECT: nudity or sexual content; graphic
violence or gore; hate symbols; content that glorifies or promotes alcohol or
other drugs (bottles, drinking, bar scenes as celebration); self-harm; illegal
activity; or spam/advertising. When unsure, reject. Reply with ONLY compact JSON:
{"safe": true|false, "reason": "short phrase"}`;

function mimeFromPath(path: string): string {
  const p = path.toLowerCase();
  if (p.endsWith('.png')) return 'image/png';
  if (p.endsWith('.webp')) return 'image/webp';
  if (p.endsWith('.gif')) return 'image/gif';
  return 'image/jpeg';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  let momentId: string | undefined;
  try {
    ({ momentId } = await req.json());
    if (!momentId) throw new Error('momentId required');
    if (!ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY is not set');

    const { data: m, error } = await supabase
      .from('moments')
      .select('id, media_path, media_type, thumb_path, shared, moderation_status')
      .eq('id', momentId)
      .maybeSingle();
    if (error) throw error;
    if (!m || !m.shared || m.moderation_status !== 'pending') {
      return new Response(JSON.stringify({ skipped: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Screen the first frame for video, the image itself for a photo.
    const path = m.media_type === 'video' ? m.thumb_path : m.media_path;
    if (!path) throw new Error('no image to screen');

    const { data: blob, error: dlErr } = await supabase.storage.from('moments').download(path);
    if (dlErr || !blob) throw dlErr ?? new Error('download failed');
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const b64 = base64Encode(bytes);

    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 80,
        system: SYSTEM,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mimeFromPath(path), data: b64 } },
            { type: 'text', text: 'Screen this image.' },
          ],
        }],
      }),
    });
    const data = await resp.json();
    if (!resp.ok || data.type === 'error') {
      throw new Error(`Anthropic ${resp.status}: ${JSON.stringify(data)}`);
    }

    const text: string = data.content?.[0]?.text ?? '';
    let verdict: { safe?: boolean; reason?: string } = {};
    try {
      verdict = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1));
    } catch {
      // Unparseable — fail closed.
      verdict = { safe: false, reason: 'unclear' };
    }

    await supabase
      .from('moments')
      .update({
        moderation_status: verdict.safe ? 'approved' : 'rejected',
        moderation_reason: verdict.reason ?? null,
        moderated_at: new Date().toISOString(),
      })
      .eq('id', momentId);

    return new Response(JSON.stringify({ approved: !!verdict.safe }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    // Fail CLOSED: leave the moment 'pending' so it never appears unscreened.
    console.error('[moderate-moment] FAILED', momentId, error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
