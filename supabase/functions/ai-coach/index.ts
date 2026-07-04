import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
// Claude Opus 4.8 — the warmest, most capable model for crisis conversation.
// If cost becomes a concern for this high-frequency chat, swap to a cheaper
// tier (e.g. 'claude-haiku-4-5') — this one line is the only change needed.
const MODEL = 'claude-opus-4-8';

const SYSTEM_PROMPT = `You are a compassionate recovery support companion for Alchono,
an app that helps people understand their relationship with alcohol.

Your role:
- Use motivational interviewing techniques — reflect, explore, affirm
- NEVER shame, judge, preach, or lecture
- Be warm, calm, and human
- Ask one open question at a time
- Acknowledge feelings before offering suggestions
- If someone is in immediate danger, gently suggest emergency services
- Keep responses short (2-4 sentences) unless the user needs more

You are NOT a replacement for professional support. If someone describes a medical emergency,
direct them to call emergency services immediately.

Remember: change happens through connection, not correction.`;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { messages, sessionType, context } = await req.json();

    // Prove we were called, the key exists, and which model we're using.
    console.log('[ai-coach] invoked', {
      sessionType: sessionType ?? 'general',
      messageCount: Array.isArray(messages) ? messages.length : 0,
      hasApiKey: !!ANTHROPIC_API_KEY,
      model: MODEL,
    });

    if (!ANTHROPIC_API_KEY) {
      console.error('[ai-coach] ANTHROPIC_API_KEY secret is missing — set it with: supabase secrets set ANTHROPIC_API_KEY=sk-ant-...');
      throw new Error('ANTHROPIC_API_KEY is not set in edge function secrets');
    }

    let systemMessage = sessionType === 'sos'
      ? SYSTEM_PROMPT + '\n\nThis is an SOS session. The user is reaching out in a moment of crisis. Be especially warm and present.'
      : SYSTEM_PROMPT;

    // Personal context the app sends (first names and the user's own stats,
    // shared with their consent via the app). Weave it in naturally — never
    // recite it back as a list.
    if (context && typeof context === 'object') {
      const lines: string[] = [];
      if (context.username) lines.push(`They go by ${context.username}.`);
      if (context.partnerName) lines.push(`Partner: ${context.partnerName}.`);
      if (context.childrenNames) lines.push(`Children: ${context.childrenNames}.`);
      if (context.petName) lines.push(`Pet: ${context.petName}.`);
      if (typeof context.urgesBeaten === 'number' && context.urgesBeaten > 0)
        lines.push(`They have beaten ${context.urgesBeaten} urges using the app.`);
      if (typeof context.afDaysThisMonth === 'number' && context.afDaysThisMonth > 0)
        lines.push(`${context.afDaysThisMonth} alcohol-free days marked this month.`);
      if (context.sessionActive)
        lines.push('They are CURRENTLY in a drinking session — meet them there without judgement.');
      if (context.livesIsolated)
        lines.push('They live somewhere rural/isolated; in-person support is hard to reach.');
      if (lines.length > 0) {
        systemMessage +=
          '\n\nWhat you quietly know about this person (use it naturally when relevant, never recite it):\n- ' +
          lines.join('\n- ');
      }
    }

    // Anthropic takes the system prompt as a top-level string (not a message),
    // and only user/assistant turns in the messages array.
    const turns = (Array.isArray(messages) ? messages : [])
      .filter((m: { role?: string }) => m?.role === 'user' || m?.role === 'assistant')
      .slice(-20);

    // Anthropic requires the FIRST message to be from the user (unlike OpenAI,
    // which tolerated a leading assistant turn). The app seeds the thread with
    // an assistant greeting, so strip any leading assistant turns — otherwise
    // the API 400s and the user only ever sees the fallback message.
    while (turns.length > 0 && turns[0].role !== 'user') {
      turns.shift();
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 300,
        temperature: 0.8,
        system: systemMessage,
        messages: turns,
      }),
    });

    const data = await response.json();

    // If Anthropic is unhappy, put the WHOLE error object in the logs.
    if (!response.ok || data.type === 'error') {
      console.error('[ai-coach] Anthropic error', {
        status: response.status,
        statusText: response.statusText,
        body: JSON.stringify(data),
      });
      throw new Error(
        `Anthropic ${response.status}: ${data.error?.message ?? JSON.stringify(data)}`,
      );
    }

    // Response text lives in the first text block of the content array.
    const reply = data.content?.[0]?.text ?? "I'm here for you.";
    console.log('[ai-coach] ok', { replyChars: reply.length });

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    // Never swallow — full exception (message + stack) into the logs,
    // and a real error status so the client knows this call failed.
    console.error('[ai-coach] FAILED', error, (error as Error)?.stack);
    return new Response(
      JSON.stringify({
        error: String(error),
        reply: "I'm having trouble connecting right now. I'm still here for you.",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
